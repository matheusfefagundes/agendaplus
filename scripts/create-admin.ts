import "dotenv/config";
import { pool } from "../src/db/client";
import { gerarHashSenha } from "../src/lib/auth";

async function main() {
  const [nome, email, senha] = process.argv.slice(2);

  if (!nome || !email || !senha) {
    console.error('Uso: npx tsx scripts/create-admin.ts "Nome" email@exemplo.com "senha-forte"');
    process.exitCode = 1;
    return;
  }

  if (senha.length < 8) {
    console.error("A senha precisa ter pelo menos 8 caracteres.");
    process.exitCode = 1;
    return;
  }

  const existing = await pool.query("SELECT id FROM usuarios WHERE LOWER(email) = LOWER($1)", [email]);
  if (existing.rows.length > 0) {
    console.error("Já existe um usuário com esse e-mail.");
    process.exitCode = 1;
    return;
  }

  const senhaHash = await gerarHashSenha(senha);

  const result = await pool.query<{ id: string }>(
    `INSERT INTO usuarios (nome, email, senha_hash, tipo) VALUES ($1, $2, $3, 'admin') RETURNING id`,
    [nome, email, senhaHash],
  );

  console.log(`Admin criado com sucesso: ${result.rows[0].id}`);
}

main()
  .catch((error) => {
    console.error("Falha ao criar admin:", error);
    process.exitCode = 1;
  })
  .finally(() => {
    void pool.end();
  });
