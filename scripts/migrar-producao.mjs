// Roda as migrations pendentes no banco durante o build da Vercel.
// Só age no deploy de produção (VERCEL_ENV=production): previews e builds
// locais/CI não tocam no banco. Se falhar, o build falha e a versão anterior
// continua no ar.
import { runner } from "node-pg-migrate";

if (process.env.VERCEL_ENV !== "production") {
  console.log("[migrations] Não é deploy de produção — pulando.");
  process.exit(0);
}

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("[migrations] DATABASE_URL não definida no ambiente de produção.");
  process.exit(1);
}

try {
  const executadas = await runner({
    databaseUrl: { connectionString, ssl: { rejectUnauthorized: false } },
    dir: "src/db/migrations",
    direction: "up",
    migrationsTable: "pgmigrations",
    // Migrations de branches diferentes podem ter datas fora de ordem.
    checkOrder: false,
    log: (mensagem) => console.log(`[migrations] ${mensagem}`),
  });
  console.log(
    executadas.length
      ? `[migrations] Aplicadas: ${executadas.map((m) => m.name).join(", ")}`
      : "[migrations] Banco já está atualizado.",
  );
} catch (error) {
  console.error("[migrations] Falha ao rodar as migrations:", error);
  process.exit(1);
}
