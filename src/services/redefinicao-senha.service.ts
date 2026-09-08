import { createHash, randomBytes } from "node:crypto";
import { pool } from "@/db/client";
import { gerarHashSenha } from "@/lib/auth";
import { enviarEmailRedefinicaoSenha } from "@/lib/email";

const DURACAO_TOKEN_MS = 60 * 60 * 1000;

export class TokenRedefinicaoInvalidoError extends Error {}

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export async function solicitarRedefinicaoSenha(email: string, appUrl: string): Promise<void> {
  const usuarioResult = await pool.query<{ id: string; nome: string; email: string }>(
    `SELECT id, nome, email
     FROM usuarios
     WHERE LOWER(email) = LOWER($1) AND ativo = true`,
    [email],
  );
  const usuario = usuarioResult.rows[0];

  // A rota sempre devolve a mesma resposta, exista ou não uma conta.
  if (!usuario) return;

  const token = randomBytes(32).toString("hex");
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + DURACAO_TOKEN_MS);
  const client = await pool.connect();

  try {
    await client.query("BEGIN");
    await client.query(
      "UPDATE redefinicoes_senha SET used_at = now() WHERE usuario_id = $1 AND used_at IS NULL",
      [usuario.id],
    );
    await client.query(
      `INSERT INTO redefinicoes_senha (usuario_id, token_hash, expires_at)
       VALUES ($1, $2, $3)`,
      [usuario.id, tokenHash, expiresAt],
    );
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }

  const baseUrl = appUrl.replace(/\/$/, "");
  try {
    await enviarEmailRedefinicaoSenha({
      destinatario: usuario.email,
      nome: usuario.nome,
      link: `${baseUrl}/redefinir-senha?token=${encodeURIComponent(token)}`,
    });
  } catch (error) {
    await pool.query("DELETE FROM redefinicoes_senha WHERE token_hash = $1", [tokenHash]);
    throw error;
  }
}

export async function redefinirSenha(token: string, novaSenha: string): Promise<void> {
  const tokenHash = hashToken(token);
  const novaSenhaHash = await gerarHashSenha(novaSenha);
  const client = await pool.connect();

  try {
    await client.query("BEGIN");
    const tokenResult = await client.query<{ usuario_id: string }>(
      `SELECT r.usuario_id
       FROM redefinicoes_senha r
       JOIN usuarios u ON u.id = r.usuario_id
       WHERE r.token_hash = $1
         AND r.used_at IS NULL
         AND r.expires_at > now()
         AND u.ativo = true
       FOR UPDATE OF r`,
      [tokenHash],
    );
    const registro = tokenResult.rows[0];
    if (!registro) {
      throw new TokenRedefinicaoInvalidoError("Este link é inválido ou já expirou.");
    }

    await client.query("UPDATE usuarios SET senha_hash = $1 WHERE id = $2", [
      novaSenhaHash,
      registro.usuario_id,
    ]);
    await client.query(
      "UPDATE redefinicoes_senha SET used_at = now() WHERE usuario_id = $1 AND used_at IS NULL",
      [registro.usuario_id],
    );
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
