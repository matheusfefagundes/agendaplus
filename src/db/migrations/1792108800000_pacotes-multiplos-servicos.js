exports.shorthands = undefined;

/**
 * @param {import('node-pg-migrate').MigrationBuilder} pgm
 */
exports.up = (pgm) => {
  pgm.sql(`
    -- Um pacote passa a valer para vários serviços: as sessões são um saldo
    -- único que o cliente usa em qualquer um deles, intercalando.
    CREATE TABLE pacotes_servicos (
        pacote_id   UUID NOT NULL REFERENCES pacotes(id) ON DELETE CASCADE,
        servico_id  UUID NOT NULL REFERENCES servicos(id) ON DELETE RESTRICT,
        PRIMARY KEY (pacote_id, servico_id)
    );
    CREATE INDEX idx_pacotes_servicos_servico ON pacotes_servicos(servico_id);

    CREATE TABLE pacotes_cliente_servicos (
        pacote_cliente_id UUID NOT NULL REFERENCES pacotes_cliente(id) ON DELETE CASCADE,
        servico_id        UUID NOT NULL REFERENCES servicos(id) ON DELETE RESTRICT,
        PRIMARY KEY (pacote_cliente_id, servico_id)
    );
    CREATE INDEX idx_pacotes_cliente_servicos_servico ON pacotes_cliente_servicos(servico_id);

    INSERT INTO pacotes_servicos (pacote_id, servico_id) SELECT id, servico_id FROM pacotes;
    INSERT INTO pacotes_cliente_servicos (pacote_cliente_id, servico_id) SELECT id, servico_id FROM pacotes_cliente;

    ALTER TABLE pacotes DROP COLUMN servico_id;
    ALTER TABLE pacotes_cliente DROP COLUMN servico_id;

    COMMENT ON TABLE pacotes IS 'Catálogo de pacotes: serviços + quantidade de sessões + valor + validade.';
    COMMENT ON TABLE pacotes_servicos IS 'Serviços em que as sessões do pacote podem ser usadas.';
    COMMENT ON TABLE pacotes_cliente_servicos IS 'Cópia dos serviços do pacote no momento da venda ao cliente.';
  `);
};

/**
 * @param {import('node-pg-migrate').MigrationBuilder} pgm
 */
exports.down = (pgm) => {
  pgm.sql(`
    -- Volta para um serviço por pacote: mantém o primeiro serviço de cada um.
    ALTER TABLE pacotes ADD COLUMN servico_id UUID REFERENCES servicos(id) ON DELETE RESTRICT;
    ALTER TABLE pacotes_cliente ADD COLUMN servico_id UUID REFERENCES servicos(id) ON DELETE RESTRICT;

    UPDATE pacotes p SET servico_id = (
      SELECT ps.servico_id FROM pacotes_servicos ps WHERE ps.pacote_id = p.id ORDER BY ps.servico_id LIMIT 1
    );
    UPDATE pacotes_cliente pc SET servico_id = (
      SELECT pcs.servico_id FROM pacotes_cliente_servicos pcs
      WHERE pcs.pacote_cliente_id = pc.id ORDER BY pcs.servico_id LIMIT 1
    );

    ALTER TABLE pacotes ALTER COLUMN servico_id SET NOT NULL;
    ALTER TABLE pacotes_cliente ALTER COLUMN servico_id SET NOT NULL;
    CREATE INDEX idx_pacotes_servico ON pacotes(servico_id);
    CREATE INDEX idx_pacotes_cliente_servico ON pacotes_cliente(servico_id);

    DROP TABLE IF EXISTS pacotes_cliente_servicos;
    DROP TABLE IF EXISTS pacotes_servicos;
  `);
};
