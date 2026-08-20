import { NextRequest, NextResponse } from "next/server";
import { loginSchema } from "@/lib/validation";
import { login, AuthError } from "@/services/auth.service";
import { criarSessao, definirCookieSessao } from "@/lib/auth";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    const mensagem = parsed.error.issues[0]?.message ?? "Dados inválidos.";
    return NextResponse.json({ error: mensagem }, { status: 400 });
  }

  const ip = getClientIp(request);
  if (!checkRateLimit(`login:${ip}:${parsed.data.email}`)) {
    return NextResponse.json(
      { error: "Muitas tentativas. Tente novamente mais tarde." },
      { status: 429 },
    );
  }

  try {
    const { id, role } = await login(parsed.data);
    const token = await criarSessao({ sub: id, role });

    const response = NextResponse.json({ role });
    definirCookieSessao(response, token);
    return response;
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    console.error("Erro ao autenticar usuário:", error);
    return NextResponse.json({ error: "Não foi possível entrar." }, { status: 500 });
  }
}
