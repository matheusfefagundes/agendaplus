exports.shorthands = undefined;

/**
 * @param {import('node-pg-migrate').MigrationBuilder} pgm
 */
exports.up = (pgm) => {
  pgm.sql(`
    -- Contador de tentativas (login, cadastro, recuperação de senha) compartilhado
    -- entre instâncias serverless — um Map em memória não resiste a cold starts
    -- nem é visto por outras invocações concorrentes na Vercel.
    CREATE TABLE rate_limits (
        chave       VARCHAR(255) PRIMARY KEY,
        contagem    INTEGER NOT NULL DEFAULT 1,
        expira_em   TIMESTAMPTZ NOT NULL
    );

    CREATE INDEX idx_rate_limits_expiracao ON rate_limits(expira_em);
  `);
};

/**
 * @param {import('node-pg-migrate').MigrationBuilder} pgm
 */
exports.down = (pgm) => {
  pgm.sql("DROP TABLE IF EXISTS rate_limits;");
};
