import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { solicitarRedefinicaoSenhaSchema } from "@/lib/validation";
import { solicitarRedefinicaoSenha } from "@/services/redefinicao-senha.service";

const MENSAGEM_SUCESSO =
  "Se houver uma conta com este e-mail, você receberá as instruções para redefinir sua senha.";

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  if (!checkRateLimit(`esqueci-senha:${ip}`, 5, 15 * 60 * 1000)) {
    return NextResponse.json({ error: "Muitas tentativas. Tente novamente mais tarde." }, { status: 429 });
  }

  const body = await request.json().catch(() => null);
  const parsed = solicitarRedefinicaoSenhaSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Dados inválidos." },
      { status: 400 },
    );
  }

  try {
    const appUrl = process.env.APP_URL ?? request.nextUrl.origin;
    await solicitarRedefinicaoSenha(parsed.data.email, appUrl);
    return NextResponse.json({ message: MENSAGEM_SUCESSO });
  } catch (error) {
    console.error("Erro ao solicitar redefinição de senha:", error);
    return NextResponse.json({ error: "Não foi possível enviar o e-mail. Tente novamente." }, { status: 500 });
  }
}
