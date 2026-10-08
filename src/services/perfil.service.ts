import { pool } from "@/db/client";
import { gerarHashSenha, verificarSenha } from "@/lib/auth";

export class PerfilError extends Error {}

// temSenha é false para contas criadas pelo login com Google.
export async function obterPerfil(
  usuarioId: string,
): Promise<{ nome: string; email: string; temSenha: boolean } | null> {
  const result = await pool.query<{ nome: string; email: string; tem_senha: boolean }>(
    "SELECT nome, email, senha_hash IS NOT NULL AS tem_senha FROM usuarios WHERE id = $1",
    [usuarioId],
  );
  const row = result.rows[0];
  return row ? { nome: row.nome, email: row.email, temSenha: row.tem_senha } : null;
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

// Contas criadas pelo Google não têm senha: a primeira é criada sem pedir a
// senha atual. Nas demais, a senha atual é obrigatória.
export async function alterarSenha(
  usuarioId: string,
  senhaAtual: string | undefined,
  novaSenha: string,
): Promise<void> {
  const result = await pool.query<{ senha_hash: string | null }>(
    "SELECT senha_hash FROM usuarios WHERE id = $1",
    [usuarioId],
  );
  const usuario = result.rows[0];
  if (!usuario) throw new PerfilError("Usuário não encontrado.");

  if (usuario.senha_hash !== null) {
    if (!senhaAtual) throw new PerfilError("Informe sua senha atual.");
    if (!(await verificarSenha(senhaAtual, usuario.senha_hash))) {
      throw new PerfilError("Senha atual incorreta.");
    }
  }

  const novoHash = await gerarHashSenha(novaSenha);
  await pool.query("UPDATE usuarios SET senha_hash = $1 WHERE id = $2", [novoHash, usuarioId]);
}
