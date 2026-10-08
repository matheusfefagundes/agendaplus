import { NextRequest, NextResponse } from "next/server";
import { jwtVerify, createRemoteJWKSet } from "jose";
import { obterSessaoAdmin } from "@/lib/auth";
import {
  agendarSincronizacaoFuturosGoogle,
  salvarIntegracaoGoogleAgenda,
} from "@/services/google-agenda.service";
import { NOME_COOKIE_STATE_GOOGLE_AGENDA, URL_RETORNO_GOOGLE_AGENDA } from "@/utils/googleAgenda";

const GOOGLE_JWKS = createRemoteJWKSet(new URL("https://www.googleapis.com/oauth2/v3/certs"));

export async function GET(request: NextRequest) {
  function redirecionar(resultado: "conectado" | "erro") {
    const response = NextResponse.redirect(new URL(`/admin/configuracoes?googleAgenda=${resultado}`, request.url));
    response.cookies.delete(NOME_COOKIE_STATE_GOOGLE_AGENDA);
    return response;
  }

  const sessao = await obterSessaoAdmin();
  const code = request.nextUrl.searchParams.get("code");
  const state = request.nextUrl.searchParams.get("state");
  const stateCookie = request.cookies.get(NOME_COOKIE_STATE_GOOGLE_AGENDA)?.value;

  if (!sessao || !code || !state || !stateCookie || state !== stateCookie) {
    return redirecionar("erro");
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const appUrl = process.env.APP_URL;
  if (!clientId || !clientSecret || !appUrl) return redirecionar("erro");

  try {
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: `${appUrl}${URL_RETORNO_GOOGLE_AGENDA}`,
        grant_type: "authorization_code",
      }),
    });
    if (!tokenResponse.ok) {
      throw new Error(`Falha ao trocar código pelo token do Google (${tokenResponse.status}).`);
    }

    const tokenData = (await tokenResponse.json()) as {
      id_token?: string;
      refresh_token?: string;
      scope?: string;
    };
    if (!tokenData.id_token || !tokenData.refresh_token) {
      throw new Error("Resposta do Google sem id_token ou refresh_token.");
    }
    if (!tokenData.scope?.includes("calendar.events")) {
      throw new Error("Permissão de acesso à agenda não concedida.");
    }

    const { payload } = await jwtVerify(tokenData.id_token, GOOGLE_JWKS, {
      issuer: ["https://accounts.google.com", "accounts.google.com"],
      audience: clientId,
    });
    if (typeof payload.email !== "string") throw new Error("Google não retornou o e-mail da conta.");

    await salvarIntegracaoGoogleAgenda({
      usuarioId: sessao.sub,
      email: payload.email,
      refreshToken: tokenData.refresh_token,
    });
    agendarSincronizacaoFuturosGoogle();

    return redirecionar("conectado");
  } catch (error) {
    console.error("Erro ao conectar o Google Agenda:", error);
    return redirecionar("erro");
  }
}
