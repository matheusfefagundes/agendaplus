/* eslint-disable @typescript-eslint/no-var-requires */

exports.shorthands = undefined;

/**
 * @param {import('node-pg-migrate').MigrationBuilder} pgm
 */
exports.up = (pgm) => {
  pgm.sql(`
    -- ============================================================
    -- AGENDA+ — Schema PostgreSQL (single-tenant / RBAC)
    -- ============================================================

    CREATE EXTENSION IF NOT EXISTS btree_gist;
    CREATE EXTENSION IF NOT EXISTS pgcrypto;

    CREATE TYPE tipo_usuario AS ENUM ('admin', 'cliente');

    CREATE TYPE status_agendamento AS ENUM (
        'pendente',
        'confirmado',
        'cancelado',
        'concluido'
    );

    -- Postgres não tem range type nativo para TIME (só para timestamp,
    -- timestamptz, date e numérico) — precisamos declarar o nosso para
    -- usar timerange(...) no EXCLUDE de horarios_disponibilidade abaixo.
    CREATE TYPE timerange AS RANGE (subtype = time);

    CREATE OR REPLACE FUNCTION trg_set_updated_at()
    RETURNS TRIGGER AS $$
    BEGIN
        NEW.updated_at = now();
        RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;

    -- ============================================================
    -- 1. USUARIOS — autenticação (JWT + bcrypt). RBAC: tipo = admin
    --    (dono da clínica) ou cliente (quem agenda).
    -- ============================================================
    CREATE TABLE usuarios (
        id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        nome            VARCHAR(150)  NOT NULL,
        email           VARCHAR(150)  NOT NULL,
        senha_hash      VARCHAR(255)  NOT NULL,
        tipo            tipo_usuario  NOT NULL,
        ativo           BOOLEAN       NOT NULL DEFAULT TRUE,
        created_at      TIMESTAMPTZ   NOT NULL DEFAULT now(),
        updated_at      TIMESTAMPTZ   NOT NULL DEFAULT now()
    );

    CREATE TRIGGER set_updated_at_usuarios
        BEFORE UPDATE ON usuarios
        FOR EACH ROW EXECUTE FUNCTION trg_set_updated_at();

    CREATE UNIQUE INDEX idx_usuarios_email ON usuarios (LOWER(email));
    CREATE INDEX idx_usuarios_tipo ON usuarios(tipo);

    -- ============================================================
    -- 2. CLIENTES — dados adicionais de quem tem tipo = 'cliente'.
    -- ============================================================
    CREATE TABLE clientes (
        id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        usuario_id              UUID NOT NULL UNIQUE REFERENCES usuarios(id) ON DELETE CASCADE,
        telefone                VARCHAR(20),
        data_nascimento         DATE,
        observacoes_clinicas    TEXT,
        ativo                   BOOLEAN NOT NULL DEFAULT TRUE,
        created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at              TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    CREATE TRIGGER set_updated_at_clientes
        BEFORE UPDATE ON clientes
        FOR EACH ROW EXECUTE FUNCTION trg_set_updated_at();

    -- ============================================================
    -- 3. SERVICOS — portfólio de tratamentos.
    -- ============================================================
    CREATE TABLE servicos (
        id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        nome                VARCHAR(150) NOT NULL,
        descricao           TEXT,
        duracao_minutos     INTEGER NOT NULL CHECK (duracao_minutos > 0),
        valor               NUMERIC(10,2) NOT NULL CHECK (valor >= 0),
        ativo               BOOLEAN NOT NULL DEFAULT TRUE,
        created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    CREATE TRIGGER set_updated_at_servicos
        BEFORE UPDATE ON servicos
        FOR EACH ROW EXECUTE FUNCTION trg_set_updated_at();

    CREATE INDEX idx_servicos_ativo ON servicos(ativo);

    -- ============================================================
    -- 4. HORARIOS_DISPONIBILIDADE — grade fixa semanal de trabalho.
    --    EXCLUDE impede duas janelas se sobrepondo no mesmo dia.
    -- ============================================================
    CREATE TABLE horarios_disponibilidade (
        id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        dia_semana          SMALLINT NOT NULL CHECK (dia_semana BETWEEN 0 AND 6),
        hora_inicio         TIME NOT NULL,
        hora_fim            TIME NOT NULL CHECK (hora_fim > hora_inicio),
        intervalo_minutos   INTEGER NOT NULL DEFAULT 0,
        ativo               BOOLEAN NOT NULL DEFAULT TRUE,
        created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),

        CONSTRAINT sem_conflito_grade_horaria EXCLUDE USING gist (
            dia_semana WITH =,
            timerange(hora_inicio, hora_fim, '[)') WITH &&
        ) WHERE (ativo)
    );

    CREATE TRIGGER set_updated_at_horarios
        BEFORE UPDATE ON horarios_disponibilidade
        FOR EACH ROW EXECUTE FUNCTION trg_set_updated_at();

    -- ============================================================
    -- 5. BLOQUEIOS_AGENDA — exceções pontuais (folgas, feriados).
    -- ============================================================
    CREATE TABLE bloqueios_agenda (
        id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        data_hora_inicio    TIMESTAMPTZ NOT NULL,
        data_hora_fim       TIMESTAMPTZ NOT NULL CHECK (data_hora_fim > data_hora_inicio),
        motivo              VARCHAR(255),
        created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    CREATE TRIGGER set_updated_at_bloqueios
        BEFORE UPDATE ON bloqueios_agenda
        FOR EACH ROW EXECUTE FUNCTION trg_set_updated_at();

    CREATE INDEX idx_bloqueios_periodo ON bloqueios_agenda USING gist (tstzrange(data_hora_inicio, data_hora_fim));

    -- ============================================================
    -- 6. AGENDAMENTOS — núcleo do sistema. Impede choque de horário
    --    (double booking) via EXCLUDE constraint.
    -- ============================================================
    CREATE TABLE agendamentos (
        id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        cliente_id          UUID NOT NULL REFERENCES clientes(id) ON DELETE RESTRICT,
        servico_id          UUID NOT NULL REFERENCES servicos(id) ON DELETE RESTRICT,
        data_hora_inicio    TIMESTAMPTZ NOT NULL,
        data_hora_fim       TIMESTAMPTZ NOT NULL CHECK (data_hora_fim > data_hora_inicio),
        status              status_agendamento NOT NULL DEFAULT 'pendente',
        observacoes         TEXT,
        created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),

        CONSTRAINT sem_conflito_horario EXCLUDE USING gist (
            tstzrange(data_hora_inicio, data_hora_fim, '[)') WITH &&
        ) WHERE (status IN ('pendente', 'confirmado'))
    );

    CREATE TRIGGER set_updated_at_agendamentos
        BEFORE UPDATE ON agendamentos
        FOR EACH ROW EXECUTE FUNCTION trg_set_updated_at();

    CREATE INDEX idx_agendamentos_cliente ON agendamentos(cliente_id);
    CREATE INDEX idx_agendamentos_servico ON agendamentos(servico_id);
    CREATE INDEX idx_agendamentos_status ON agendamentos(status);
    CREATE INDEX idx_agendamentos_data ON agendamentos(data_hora_inicio);

    -- ============================================================
    -- Comentários de documentação
    -- ============================================================
    COMMENT ON TABLE usuarios IS 'Autenticação (RBAC: admin/cliente), JWT + bcrypt';
    COMMENT ON TABLE clientes IS 'Dados de contato e histórico clínico dos pacientes/clientes';
    COMMENT ON TABLE servicos IS 'Portfólio de tratamentos oferecidos, com valor e status ativo/inativo';
    COMMENT ON TABLE horarios_disponibilidade IS 'Grade fixa semanal de horários de trabalho';
    COMMENT ON TABLE bloqueios_agenda IS 'Exceções pontuais na agenda (folgas, feriados, compromissos)';
    COMMENT ON TABLE agendamentos IS 'Reservas de horário; impede sobreposição via EXCLUDE constraint';
  `);
};

/**
 * @param {import('node-pg-migrate').MigrationBuilder} pgm
 */
exports.down = (pgm) => {
  pgm.sql(`
    DROP TABLE IF EXISTS agendamentos;
    DROP TABLE IF EXISTS bloqueios_agenda;
    DROP TABLE IF EXISTS horarios_disponibilidade;
    DROP TABLE IF EXISTS servicos;
    DROP TABLE IF EXISTS clientes;
    DROP TABLE IF EXISTS usuarios;

    DROP FUNCTION IF EXISTS trg_set_updated_at;

    DROP TYPE IF EXISTS status_agendamento;
    DROP TYPE IF EXISTS tipo_usuario;
    DROP TYPE IF EXISTS timerange;
  `);
};
