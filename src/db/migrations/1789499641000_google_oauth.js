exports.shorthands = undefined;

/**
 * @param {import('node-pg-migrate').MigrationBuilder} pgm
 */
exports.up = (pgm) => {
  pgm.sql(`
    ALTER TABLE usuarios ALTER COLUMN senha_hash DROP NOT NULL;
    ALTER TABLE usuarios ADD COLUMN google_id VARCHAR(255);

    CREATE UNIQUE INDEX idx_usuarios_google_id
      ON usuarios(google_id)
      WHERE google_id IS NOT NULL;
  `);
};

/**
 * @param {import('node-pg-migrate').MigrationBuilder} pgm
 */
exports.down = (pgm) => {
  pgm.sql(`
    DROP INDEX IF EXISTS idx_usuarios_google_id;
    ALTER TABLE usuarios DROP COLUMN IF EXISTS google_id;
  `);
};
