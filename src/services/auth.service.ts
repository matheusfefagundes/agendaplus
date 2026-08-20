import { pool } from "@/db/client";
import { gerarHashSenha, verificarSenha, type Papel } from "@/lib/auth";

export class AuthError extends Error {}

// Hash bcrypt válido de uma senha que nunca será usada — serve só para o
// bcrypt.compare "gastar" o mesmo tempo quando o e-mail não existe, evitando
// que a diferença de latência revele se a conta existe (user enumeration).
const DUMMY_HASH = "$2a$12$CwaJ4X0aQK1n8yqOZ0oXVOQ6r7f6qgq8g8QGz2H6iM9nGQeYQxjTG";

export async function registerCliente(input: { nome: string; email: string; senha: string }) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const existing = await client.query("SELECT id FROM usuarios WHERE LOWER(email) = LOWER($1)", [
      input.email,
    ]);
    if ((existing.rowCount ?? 0) > 0) {
      throw new AuthError("Este e-mail já está cadastrado.");
    }

    const senhaHash = await gerarHashSenha(input.senha);

    const usuarioResult = await client.query<{ id: string }>(
      `INSERT INTO usuarios (nome, email, senha_hash, tipo)
       VALUES ($1, $2, $3, 'cliente')
       RETURNING id`,
      [input.nome, input.email, senhaHash],
    );
    const usuarioId = usuarioResult.rows[0].id;

    await client.query("INSERT INTO clientes (usuario_id) VALUES ($1)", [usuarioId]);

    await client.query("COMMIT");

    return { id: usuarioId, role: "cliente" as const };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function login(input: { email: string; senha: string }) {
  const result = await pool.query<{ id: string; senha_hash: string; tipo: Papel; ativo: boolean }>(
    "SELECT id, senha_hash, tipo, ativo FROM usuarios WHERE LOWER(email) = LOWER($1)",
    [input.email],
  );

  const usuario = result.rows[0];
  const senhaOk = await verificarSenha(input.senha, usuario?.senha_hash ?? DUMMY_HASH);

  if (!usuario || !usuario.ativo || !senhaOk) {
    throw new AuthError("E-mail ou senha inválidos.");
  }

  return { id: usuario.id, role: usuario.tipo };
}
