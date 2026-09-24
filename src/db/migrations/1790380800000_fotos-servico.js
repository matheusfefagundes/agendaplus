exports.shorthands = undefined;

/**
 * @param {import('node-pg-migrate').MigrationBuilder} pgm
 */
exports.up = (pgm) => {
  pgm.sql(`
    ALTER TABLE servicos ADD COLUMN foto BYTEA;

    COMMENT ON COLUMN servicos.foto IS 'Foto do serviço, já redimensionada e convertida para WebP no upload.';
  `);
};

/**
 * @param {import('node-pg-migrate').MigrationBuilder} pgm
 */
exports.down = (pgm) => {
  pgm.sql("ALTER TABLE servicos DROP COLUMN IF EXISTS foto;");
};
