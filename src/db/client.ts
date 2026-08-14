import { Pool } from "pg";

declare global {
  // eslint-disable-next-line no-var
  var _pgPool: Pool | undefined;
}

// Reaproveita o pool entre hot-reloads do `next dev` — sem isso, cada
// reload de módulo criaria um Pool novo e vazaria conexões com o Postgres.
export const pool =
  global._pgPool ??
  new Pool({
    connectionString: process.env.DATABASE_URL,
  });

if (process.env.NODE_ENV !== "production") {
  global._pgPool = pool;
}
