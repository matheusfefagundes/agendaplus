exports.shorthands = undefined;

/**
 * @param {import('node-pg-migrate').MigrationBuilder} pgm
 */
exports.up = (pgm) => {
  pgm.sql(`
    CREATE TABLE redefinicoes_senha (
        id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        usuario_id  UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
        token_hash  CHAR(64) NOT NULL UNIQUE,
        expires_at  TIMESTAMPTZ NOT NULL,
        used_at     TIMESTAMPTZ,
        created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    CREATE INDEX idx_redefinicoes_senha_usuario
      ON redefinicoes_senha(usuario_id);

    CREATE INDEX idx_redefinicoes_senha_expiracao
      ON redefinicoes_senha(expires_at)
      WHERE used_at IS NULL;
  `);
};

/**
 * @param {import('node-pg-migrate').MigrationBuilder} pgm
 */
exports.down = (pgm) => {
  pgm.sql("DROP TABLE IF EXISTS redefinicoes_senha;");
};
