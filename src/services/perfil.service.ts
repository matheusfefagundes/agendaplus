import { pool } from "@/db/client";
import { gerarHashSenha, verificarSenha } from "@/lib/auth";

export class PerfilError extends Error {}

export async function obterPerfil(usuarioId: string): Promise<{ nome: string; email: string } | null> {
  const result = await pool.query<{ nome: string; email: string }>(
    "SELECT nome, email FROM usuarios WHERE id = $1",
    [usuarioId],
  );
  return result.rows[0] ?? null;
}

export async function atualizarPerfil(
  usuarioId: string,
  input: { nome: string; email: string },
): Promise<void> {
  const existente = await pool.query(
    "SELECT id FROM usuarios WHERE LOWER(email) = LOWER($1) AND id <> $2",
    [input.email, usuarioId],
  );
  if ((existente.rowCount ?? 0) > 0) {
    throw new PerfilError("Este e-mail já está em uso por outra conta.");
  }

  await pool.query("UPDATE usuarios SET nome = $1, email = $2 WHERE id = $3", [
    input.nome,
    input.email,
    usuarioId,
  ]);
}

export async function alterarSenha(
  usuarioId: string,
  senhaAtual: string,
  novaSenha: string,
): Promise<void> {
  const result = await pool.query<{ senha_hash: string }>(
    "SELECT senha_hash FROM usuarios WHERE id = $1",
    [usuarioId],
  );
  const usuario = result.rows[0];
  if (!usuario || !(await verificarSenha(senhaAtual, usuario.senha_hash))) {
    throw new PerfilError("Senha atual incorreta.");
  }

  const novoHash = await gerarHashSenha(novaSenha);
  await pool.query("UPDATE usuarios SET senha_hash = $1 WHERE id = $2", [novoHash, usuarioId]);
}
