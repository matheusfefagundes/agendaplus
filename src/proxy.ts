import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET);

const ADMIN_PREFIX = "/admin";
const CLIENTE_PREFIX = "/cliente";
const NOME_COOKIE_SESSAO = "session";

type PayloadSessao = {
  sub: string;
  role: "admin" | "cliente";
};

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isAdminRoute = pathname.startsWith(ADMIN_PREFIX);
  const isClienteRoute = pathname.startsWith(CLIENTE_PREFIX);
  if (!isAdminRoute && !isClienteRoute) {
    return NextResponse.next();
  }

  const token = request.cookies.get(NOME_COOKIE_SESSAO)?.value;
  if (!token) {
    return NextResponse.redirect(new URL("/login", request.url));
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
  } catch {
    return NextResponse.redirect(new URL("/login", request.url));
  }
}

export const config = {
  matcher: ["/admin/:path*", "/cliente/:path*"],
};
