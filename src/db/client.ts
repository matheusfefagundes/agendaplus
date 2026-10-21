import { Pool } from "pg";

declare global {
  var _pgPool: Pool | undefined;
}

// Reaproveita o pool entre hot-reloads do `next dev` — sem isso, cada
// reload de módulo criaria um Pool novo e vazaria conexões com o Postgres.
//
// Em produção o certificado TLS é validado por padrão. Se o provedor usar um
// certificado autoassinado que o Node não reconhece, defina
// DATABASE_SSL_INSECURE=true como escape hatch temporário — desligar a
// validação por padrão expõe a conexão com o banco a um MITM.
export const pool =
  global._pgPool ??
  new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl:
      process.env.NODE_ENV === "production"
        ? { rejectUnauthorized: process.env.DATABASE_SSL_INSECURE !== "true" }
        : undefined,
  });

if (process.env.NODE_ENV !== "production") {
  global._pgPool = pool;
}
