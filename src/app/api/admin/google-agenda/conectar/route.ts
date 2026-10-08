import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import { obterSessaoAdmin } from "@/lib/auth";
import { ROTA_LOGIN_SESSAO_EXPIRADA } from "@/utils/sessao";
import { NOME_COOKIE_STATE_GOOGLE_AGENDA, URL_RETORNO_GOOGLE_AGENDA } from "@/utils/googleAgenda";

const ESCOPOS = ["openid", "email", "https://www.googleapis.com/auth/calendar.events"];

export async function GET(request: NextRequest) {
  const sessao = await obterSessaoAdmin();
  if (!sessao) return NextResponse.redirect(new URL(ROTA_LOGIN_SESSAO_EXPIRADA, request.url));

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const appUrl = process.env.APP_URL;
  if (!clientId || !appUrl) {
    console.error("Google Agenda não configurado: defina GOOGLE_CLIENT_ID e APP_URL.");
    return NextResponse.redirect(new URL("/admin/configuracoes?googleAgenda=erro", request.url));
  }

  const state = randomBytes(16).toString("hex");

  const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("redirect_uri", `${appUrl}${URL_RETORNO_GOOGLE_AGENDA}`);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", ESCOPOS.join(" "));
  url.searchParams.set("state", state);
  // offline + consent garantem o refresh_token, que permite sincronizar sem o admin logado.
  url.searchParams.set("access_type", "offline");
  url.searchParams.set("prompt", "consent select_account");

  const response = NextResponse.redirect(url);
  response.cookies.set(NOME_COOKIE_STATE_GOOGLE_AGENDA, state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 600,
  });
  return response;
}
