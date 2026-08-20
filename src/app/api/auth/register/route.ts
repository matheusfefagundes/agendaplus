import { NextRequest, NextResponse } from "next/server";
import { registerSchema } from "@/lib/validation";
import { registerCliente, AuthError } from "@/services/auth.service";
import { criarSessao, definirCookieSessao } from "@/lib/auth";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  if (!checkRateLimit(`register:${ip}`)) {
    return NextResponse.json(
      { error: "Muitas tentativas. Tente novamente mais tarde." },
      { status: 429 },
    );
  }

  const body = await request.json().catch(() => null);
  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    const mensagem = parsed.error.issues[0]?.message ?? "Dados inválidos.";
    return NextResponse.json({ error: mensagem }, { status: 400 });
  }

  try {
    const { id, role } = await registerCliente(parsed.data);
    const token = await criarSessao({ sub: id, role });

    const response = NextResponse.json({ role });
    definirCookieSessao(response, token);
    return response;
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    console.error("Erro ao registrar usuário:", error);
    return NextResponse.json({ error: "Não foi possível concluir o cadastro." }, { status: 500 });
  }
}
