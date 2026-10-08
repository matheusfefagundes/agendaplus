exports.shorthands = undefined;

/**
 * @param {import('node-pg-migrate').MigrationBuilder} pgm
 */
exports.up = (pgm) => {
  pgm.sql(`
    -- Uma única conta do Google Agenda conectada (a do admin) recebe os agendamentos.
    CREATE TABLE integracao_google_agenda (
        id              BOOLEAN PRIMARY KEY DEFAULT true CHECK (id),
        usuario_id      UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
        email           VARCHAR(255) NOT NULL,
        refresh_token   TEXT NOT NULL,
        criado_em       TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    COMMENT ON COLUMN integracao_google_agenda.refresh_token IS 'Refresh token do Google cifrado com AES-256-GCM.';

    ALTER TABLE agendamentos ADD COLUMN google_evento_id VARCHAR(255);
  `);
};

/**
 * @param {import('node-pg-migrate').MigrationBuilder} pgm
 */
exports.down = (pgm) => {
  pgm.sql(`
    ALTER TABLE agendamentos DROP COLUMN IF EXISTS google_evento_id;
    DROP TABLE IF EXISTS integracao_google_agenda;
  `);
};
