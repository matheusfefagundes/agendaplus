exports.shorthands = undefined;

/**
 * @param {import('node-pg-migrate').MigrationBuilder} pgm
 */
exports.up = (pgm) => {
  pgm.sql(`
    CREATE TABLE pacotes (
        id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        servico_id        UUID NOT NULL REFERENCES servicos(id) ON DELETE RESTRICT,
        quantidade_sessoes INTEGER NOT NULL CHECK (quantidade_sessoes > 0),
        valor             NUMERIC(10,2) NOT NULL CHECK (valor >= 0),
        validade_dias     INTEGER NOT NULL CHECK (validade_dias > 0),
        ativo             BOOLEAN NOT NULL DEFAULT TRUE,
        created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    CREATE INDEX idx_pacotes_servico ON pacotes(servico_id);
    CREATE INDEX idx_pacotes_ativo ON pacotes(ativo);

    CREATE TRIGGER set_updated_at_pacotes
      BEFORE UPDATE ON pacotes
      FOR EACH ROW EXECUTE FUNCTION trg_set_updated_at();

    CREATE TABLE pacotes_cliente (
        id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        cliente_id        UUID NOT NULL REFERENCES clientes(id) ON DELETE RESTRICT,
        pacote_id         UUID NOT NULL REFERENCES pacotes(id) ON DELETE RESTRICT,
        servico_id        UUID NOT NULL REFERENCES servicos(id) ON DELETE RESTRICT,
        quantidade_sessoes INTEGER NOT NULL CHECK (quantidade_sessoes > 0),
        valor             NUMERIC(10,2) NOT NULL CHECK (valor >= 0),
        expira_em         DATE NOT NULL,
        ativo             BOOLEAN NOT NULL DEFAULT TRUE,
        created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    CREATE INDEX idx_pacotes_cliente_cliente ON pacotes_cliente(cliente_id);
    CREATE INDEX idx_pacotes_cliente_servico ON pacotes_cliente(servico_id);

    CREATE TRIGGER set_updated_at_pacotes_cliente
      BEFORE UPDATE ON pacotes_cliente
      FOR EACH ROW EXECUTE FUNCTION trg_set_updated_at();

    ALTER TABLE agendamentos
      ADD COLUMN pacote_cliente_id UUID REFERENCES pacotes_cliente(id) ON DELETE RESTRICT;

    CREATE INDEX idx_agendamentos_pacote_cliente ON agendamentos(pacote_cliente_id);

    COMMENT ON TABLE pacotes IS 'Catálogo de pacotes: um serviço + quantidade de sessões + valor + validade.';
    COMMENT ON TABLE pacotes_cliente IS 'Pacote atribuído a um cliente, com cópia dos dados do catálogo no momento da venda.';
    COMMENT ON COLUMN agendamentos.pacote_cliente_id IS 'Pacote que pagou esta sessão; NULL quando a sessão é avulsa.';
  `);
};

/**
 * @param {import('node-pg-migrate').MigrationBuilder} pgm
 */
exports.down = (pgm) => {
  pgm.sql(`
    DROP INDEX IF EXISTS idx_agendamentos_pacote_cliente;
    ALTER TABLE agendamentos DROP COLUMN IF EXISTS pacote_cliente_id;
    DROP TABLE IF EXISTS pacotes_cliente;
    DROP TABLE IF EXISTS pacotes;
  `);
};
