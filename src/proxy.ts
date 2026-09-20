import { NextRequest, NextResponse } from "next/server";
import { errors, jwtVerify } from "jose";
import {
  PARAM_SESSAO_EXPIRADA,
  ROTA_LOGIN_SESSAO_EXPIRADA,
  VALOR_SESSAO_EXPIRADA,
} from "@/utils/sessao";

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET);

const ADMIN_PREFIX = "/admin";
const CLIENTE_PREFIX = "/cliente";
const ROTA_LOGIN = "/login";
const NOME_COOKIE_SESSAO = "session";

type PayloadSessao = {
  sub: string;
  role: "admin" | "cliente";
};

function limparCookieSessao(response: NextResponse): void {
  response.cookies.set(NOME_COOKIE_SESSAO, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

function redirecionarSessaoExpirada(request: NextRequest): NextResponse {
  const response = NextResponse.redirect(new URL(ROTA_LOGIN_SESSAO_EXPIRADA, request.url));
  limparCookieSessao(response);
  return response;
}

// Quem volta ao app abrindo /login (ou / que redireciona pra cá) com um token
// vencido também precisa ver o aviso de sessão expirada.
async function tratarLogin(request: NextRequest, token: string | undefined): Promise<NextResponse> {
  if (!token) return NextResponse.next();

  try {
    await jwtVerify(token, JWT_SECRET);
  } catch (error) {
    if (error instanceof errors.JWTExpired) {
      // Com o parâmetro já na URL não redireciona de novo (evita loop) e só limpa o cookie
      if (request.nextUrl.searchParams.get(PARAM_SESSAO_EXPIRADA) === VALOR_SESSAO_EXPIRADA) {
        const response = NextResponse.next();
        limparCookieSessao(response);
        return response;
      }
      return redirecionarSessaoExpirada(request);
    }
  }
  return NextResponse.next();
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(NOME_COOKIE_SESSAO)?.value;

  if (pathname === ROTA_LOGIN) {
    return tratarLogin(request, token);
  }

  const isAdminRoute = pathname.startsWith(ADMIN_PREFIX);
  const isClienteRoute = pathname.startsWith(CLIENTE_PREFIX);
  if (!isAdminRoute && !isClienteRoute) {
    return NextResponse.next();
  }

  if (!token) {
    return NextResponse.redirect(new URL(ROTA_LOGIN, request.url));
  }

  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    const { role } = payload as unknown as PayloadSessao;

    if (isAdminRoute && role !== "admin") {
      return NextResponse.redirect(new URL("/", request.url));
    }
    if (isClienteRoute && role !== "cliente") {
      return NextResponse.redirect(new URL("/", request.url));
    }

    return NextResponse.next();
  } catch (error) {
    if (error instanceof errors.JWTExpired) {
      return redirecionarSessaoExpirada(request);
    }
    return NextResponse.redirect(new URL(ROTA_LOGIN, request.url));
  }
}

export const config = {
  matcher: ["/admin/:path*", "/cliente/:path*", "/login"],
};
