import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
} from "node:crypto";

const ALGORITMO = "aes-256-gcm";

// Chave própria, independente do JWT_SECRET: antes a chave de cifra era
// derivada do mesmo segredo que assina as sessões, então vazar o JWT_SECRET
// comprometia sessões e o refresh token do Google Agenda ao mesmo tempo, e
// rotacionar o JWT_SECRET quebrava a integração sem aviso nenhum.
function chave(): Buffer {
  const base64 = process.env.ENCRYPTION_KEY;
  if (!base64) throw new Error("ENCRYPTION_KEY não configurado.");
  return Buffer.from(base64, "base64");
}

// Valores cifrados antes da ENCRYPTION_KEY existir usavam SHA-256(JWT_SECRET)
// como chave. Mantido só para decifrar o que já estava salvo — remover depois
// que a integração com o Google Agenda for reconectada em produção.
function chaveLegado(): Buffer | null {
  const segredo = process.env.JWT_SECRET;
  return segredo ? createHash("sha256").update(segredo).digest() : null;
}

export function cifrar(texto: string): string {
  const iv = randomBytes(12);
  const cifra = createCipheriv(ALGORITMO, chave(), iv);
  const dados = Buffer.concat([cifra.update(texto, "utf8"), cifra.final()]);
  const tag = cifra.getAuthTag();
  return [iv, tag, dados].map((parte) => parte.toString("base64")).join(".");
}

function decifrarCom(chaveUsada: Buffer, iv: Buffer, tag: Buffer, dados: Buffer): string {
  const decifra = createDecipheriv(ALGORITMO, chaveUsada, iv);
  decifra.setAuthTag(tag);
  return Buffer.concat([decifra.update(dados), decifra.final()]).toString("utf8");
}

export function decifrar(valor: string): string {
  const [iv, tag, dados] = valor
    .split(".")
    .map((parte) => Buffer.from(parte, "base64"));

  try {
    return decifrarCom(chave(), iv, tag, dados);
  } catch (error) {
    const legado = chaveLegado();
    if (!legado) throw error;
    return decifrarCom(legado, iv, tag, dados);
  }
}
