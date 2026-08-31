import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import type { NextResponse } from "next/server";
import type { PayloadSessao } from "@/types/auth";

export type { Papel, PayloadSessao } from "@/types/auth";

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET);
const DURACAO_SESSAO = "12h";
const DURACAO_SESSAO_SEGUNDOS = 60 * 60 * 12;
const CUSTO_BCRYPT = 12;

export const NOME_COOKIE_SESSAO = "session";

export function gerarHashSenha(senha: string): Promise<string> {
  return bcrypt.hash(senha, CUSTO_BCRYPT);
}

export function verificarSenha(senha: string, hash: string): Promise<boolean> {
  return bcrypt.compare(senha, hash);
}

export async function criarSessao(payload: PayloadSessao): Promise<string> {
  return new SignJWT({ role: payload.role })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime(DURACAO_SESSAO)
    .sign(JWT_SECRET);
}

export async function verificarSessao(token: string): Promise<PayloadSessao | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    if (typeof payload.sub !== "string" || (payload.role !== "admin" && payload.role !== "cliente")) {
      return null;
    }
    return { sub: payload.sub, role: payload.role };
  } catch {
    return null;
  }
}

// Lê a sessão a partir do cookie em Server Components/Route Handlers.
// Usado como segunda camada de verificação além do middleware.
export async function obterSessao(): Promise<PayloadSessao | null> {
  const store = await cookies();
  const token = store.get(NOME_COOKIE_SESSAO)?.value;
  if (!token) return null;
  return verificarSessao(token);
}

// Helper para rotas de API restritas ao papel admin — /api/** não passa
// pelo src/proxy.ts (o matcher só cobre /admin/** e /cliente/**), então cada
// rota precisa se autoproteger chamando isto no início do handler.
export async function obterSessaoAdmin(): Promise<PayloadSessao | null> {
  const sessao = await obterSessao();
  return sessao && sessao.role === "admin" ? sessao : null;
}

export async function obterSessaoCliente(): Promise<PayloadSessao | null> {
  const sessao = await obterSessao();
  return sessao && sessao.role === "cliente" ? sessao : null;
}

export function definirCookieSessao(response: NextResponse, token: string): void {
  response.cookies.set(NOME_COOKIE_SESSAO, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: DURACAO_SESSAO_SEGUNDOS,
  });
}

export function limparCookieSessao(response: NextResponse): void {
  response.cookies.set(NOME_COOKIE_SESSAO, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}
