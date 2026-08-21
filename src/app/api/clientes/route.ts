import { NextResponse } from "next/server";
import { obterSessaoAdmin } from "@/lib/auth";
import { listarClientes } from "@/services/cliente.service";

export async function GET() {
  const sessao = await obterSessaoAdmin();
  if (!sessao) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });

  const clientes = await listarClientes();
  return NextResponse.json({ clientes });
}
