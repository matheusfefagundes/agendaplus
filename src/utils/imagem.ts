import sharp from "sharp";
import convertHeic from "heic-convert";

export class FotoInvalidaError extends Error {}

const TIPOS_HEIC = new Set(["image/heic", "image/heif", "image/heic-sequence", "image/heif-sequence"]);
const EXTENSOES_IMAGEM = [".jpg", ".jpeg", ".png", ".webp", ".gif", ".avif", ".heic", ".heif"];

function pareceHeic(tipo: string, nomeArquivo: string): boolean {
  if (TIPOS_HEIC.has(tipo.toLowerCase())) return true;
  const nome = nomeArquivo.toLowerCase();
  return nome.endsWith(".heic") || nome.endsWith(".heif");
}

// O navegador às vezes não sabe o MIME de um arquivo (ex: alguns fluxos no
// Android relatam tipo vazio) — nesse caso confia na extensão do nome.
export function pareceArquivoDeImagem(tipo: string, nomeArquivo: string): boolean {
  if (tipo.startsWith("image/")) return true;
  const nome = nomeArquivo.toLowerCase();
  return EXTENSOES_IMAGEM.some((extensao) => nome.endsWith(extensao));
}

// Redimensiona (só encolhe, nunca aumenta) e converte para WebP. Usado para
// guardar fotos de serviço no banco sem depender de um storage externo.
//
// O iPhone salva foto em HEIC por padrão, formato que o `sharp` não decodifica
// (a build padrão só traz suporte a AVIF, livre de patente — o HEIC usa o
// codec HEVC, que tem licenciamento pago). Por isso, HEIC/HEIF é convertido
// para JPEG antes, com uma biblioteca que roda em WebAssembly (sem precisar
// compilar nada nativo, funciona igual na Vercel).
export async function redimensionarParaWebp(
  bytesOriginais: Buffer,
  arquivo: { tipo: string; nomeArquivo: string },
  larguraMaxima = 960,
): Promise<Buffer> {
  let bytes = bytesOriginais;

  if (pareceHeic(arquivo.tipo, arquivo.nomeArquivo)) {
    try {
      bytes = Buffer.from(await convertHeic({ buffer: bytes, format: "JPEG", quality: 0.9 }));
    } catch {
      throw new FotoInvalidaError(
        "Não foi possível converter essa foto HEIC. Tente exportar como JPEG antes de enviar.",
      );
    }
  }

  try {
    return await sharp(bytes)
      .rotate()
      .resize({ width: larguraMaxima, withoutEnlargement: true })
      .webp({ quality: 78 })
      .toBuffer();
  } catch {
    throw new FotoInvalidaError("Não foi possível processar essa imagem.");
  }
}
