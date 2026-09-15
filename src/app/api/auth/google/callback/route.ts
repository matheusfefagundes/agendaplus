import { NextRequest, NextResponse } from "next/server";
import { jwtVerify, createRemoteJWKSet } from "jose";
import { criarSessao, definirCookieSessao } from "@/lib/auth";
import { loginComGoogle, AuthError } from "@/services/auth.service";

const NOME_COOKIE_STATE = "google_oauth_state";
const GOOGLE_JWKS = createRemoteJWKSet(new URL("https://www.googleapis.com/oauth2/v3/certs"));

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const state = request.nextUrl.searchParams.get("state");
  const stateCookie = request.cookies.get(NOME_COOKIE_STATE)?.value;

  function falha() {
    const response = NextResponse.redirect(new URL("/login?erro=google", request.url));
    response.cookies.delete(NOME_COOKIE_STATE);
    return response;
  }

  if (!code || !state || !stateCookie || state !== stateCookie) {
    return falha();
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const appUrl = process.env.APP_URL;
  if (!clientId || !clientSecret || !appUrl) {
    return falha();
  }

  try {
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: `${appUrl}/api/auth/google/callback`,
        grant_type: "authorization_code",
      }),
    });

    if (!tokenResponse.ok) {
      throw new Error("Falha ao trocar código pelo token do Google.");
    }

    const tokenData = (await tokenResponse.json()) as { id_token?: string };
    if (!tokenData.id_token) {
      throw new Error("Resposta do Google sem id_token.");
    }

    const { payload } = await jwtVerify(tokenData.id_token, GOOGLE_JWKS, {
      issuer: ["https://accounts.google.com", "accounts.google.com"],
      audience: clientId,
    });

    const googleId = payload.sub;
    const email = typeof payload.email === "string" ? payload.email : undefined;
    const nome = typeof payload.name === "string" ? payload.name : email;
    const emailVerificado = payload.email_verified === true;

    if (!googleId || !email || !emailVerificado || !nome) {
      throw new Error("Dados de e-mail do Google inválidos ou não verificados.");
    }

    const { id, role } = await loginComGoogle({ googleId, email, nome });
    const token = await criarSessao({ sub: id, role });

    const response = NextResponse.redirect(new URL(role === "admin" ? "/admin" : "/cliente", request.url));
    definirCookieSessao(response, token);
    response.cookies.delete(NOME_COOKIE_STATE);
    return response;
  } catch (error) {
    if (!(error instanceof AuthError)) {
      console.error("Erro no login com Google:", error);
    }
    return falha();
  }
}
