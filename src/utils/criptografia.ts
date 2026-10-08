import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

const ALGORITMO = "aes-256-gcm";

// Chave derivada do JWT_SECRET: trocar o segredo invalida os valores cifrados.
function chave(): Buffer {
  const segredo = process.env.JWT_SECRET;
  if (!segredo) throw new Error("JWT_SECRET não configurado.");
  return createHash("sha256").update(segredo).digest();
}

export function cifrar(texto: string): string {
  const iv = randomBytes(12);
  const cifra = createCipheriv(ALGORITMO, chave(), iv);
  const dados = Buffer.concat([cifra.update(texto, "utf8"), cifra.final()]);
  const tag = cifra.getAuthTag();
  return [iv, tag, dados].map((parte) => parte.toString("base64")).join(".");
}

export function decifrar(valor: string): string {
  const [iv, tag, dados] = valor.split(".").map((parte) => Buffer.from(parte, "base64"));
  const decifra = createDecipheriv(ALGORITMO, chave(), iv);
  decifra.setAuthTag(tag);
  return Buffer.concat([decifra.update(dados), decifra.final()]).toString("utf8");
}
