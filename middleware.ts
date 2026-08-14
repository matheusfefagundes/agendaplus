import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET);

const ADMIN_PREFIX = "/admin";
const CLIENTE_PREFIX = "/cliente";

// Payload esperado do JWT emitido no login (ver src/services de auth):
// { sub: usuarioId, clinicaId, role: "admin" | "cliente" }
type SessionPayload = {
  sub: string;
  clinicaId: string;
  role: "admin" | "cliente";
};

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isAdminRoute = pathname.startsWith(ADMIN_PREFIX);
  const isClienteRoute = pathname.startsWith(CLIENTE_PREFIX);
  if (!isAdminRoute && !isClienteRoute) {
    return NextResponse.next();
  }

  const token = request.cookies.get("session")?.value;
  if (!token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    const { role } = payload as unknown as SessionPayload;

    if (isAdminRoute && role !== "admin") {
      return NextResponse.redirect(new URL("/", request.url));
    }
    if (isClienteRoute && role !== "cliente") {
      return NextResponse.redirect(new URL("/", request.url));
    }

    // clinicaId do token fica disponível aqui para, futuramente, validar
    // contra o slug da clínica na URL (ex: /c/[slug]/admin/...) antes de
    // liberar o acesso — hoje o isolamento por clínica ainda depende dos
    // services filtrarem sempre por clinica_id nas queries.
    return NextResponse.next();
  } catch {
    return NextResponse.redirect(new URL("/login", request.url));
  }
}

export const config = {
  matcher: ["/admin/:path*", "/cliente/:path*"],
};
