import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { obterSessao, obterSessaoAdmin } from "@/lib/auth";
import {
  obterFotoServico,
  removerFotoServico,
  salvarFotoServico,
} from "@/services/servico.service";
import { FotoInvalidaError, pareceArquivoDeImagem, redimensionarParaWebp } from "@/utils/imagem";

const TAMANHO_MAXIMO_BYTES = 8 * 1024 * 1024;

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const sessao = await obterSessao();
  if (!sessao) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });

  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success) {
    return NextResponse.json({ error: "Serviço não encontrado." }, { status: 404 });
  }

  const foto = await obterFotoServico(id);
  if (!foto) return NextResponse.json({ error: "Serviço não encontrado." }, { status: 404 });

  return new NextResponse(new Uint8Array(foto), {
    headers: {
      "Content-Type": "image/webp",
      // Seguro guardar por muito tempo: a URL leva ?v=<atualizadoEm> — trocar
      // a foto gera uma URL nova em vez de invalidar a antiga.
      "Cache-Control": "private, max-age=31536000, immutable",
    },
  });
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const sessao = await obterSessaoAdmin();
  if (!sessao) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });

  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success) {
    return NextResponse.json({ error: "Serviço não encontrado." }, { status: 404 });
  }

  const formData = await request.formData().catch(() => null);
  const arquivo = formData?.get("foto");
  if (!(arquivo instanceof File)) {
    return NextResponse.json({ error: "Envie um arquivo de imagem." }, { status: 400 });
  }
  if (!pareceArquivoDeImagem(arquivo.type, arquivo.name)) {
    return NextResponse.json({ error: "O arquivo precisa ser uma imagem." }, { status: 400 });
  }
  if (arquivo.size > TAMANHO_MAXIMO_BYTES) {
    return NextResponse.json({ error: "A imagem precisa ter no máximo 8MB." }, { status: 400 });
  }

  let processada: Buffer;
  try {
    const original = Buffer.from(await arquivo.arrayBuffer());
    processada = await redimensionarParaWebp(original, { tipo: arquivo.type, nomeArquivo: arquivo.name });
  } catch (error) {
    const mensagem = error instanceof FotoInvalidaError ? error.message : "Não foi possível processar essa imagem.";
    return NextResponse.json({ error: mensagem }, { status: 400 });
  }

  const atualizou = await salvarFotoServico(id, processada);
  if (!atualizou) return NextResponse.json({ error: "Serviço não encontrado." }, { status: 404 });

  return NextResponse.json({ ok: true });
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const sessao = await obterSessaoAdmin();
  if (!sessao) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });

  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success) {
    return NextResponse.json({ error: "Serviço não encontrado." }, { status: 404 });
  }

  const atualizou = await removerFotoServico(id);
  if (!atualizou) return NextResponse.json({ error: "Serviço não encontrado." }, { status: 404 });

  return NextResponse.json({ ok: true });
}
