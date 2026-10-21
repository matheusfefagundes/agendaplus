import type { StatusAgendamento } from "@/types/agendamento";
import { pool } from "@/db/client";

export type ResumoDashboard = {
  atendimentosHoje: number;
  atendimentosMes: number;
  novosClientesSemana: number;
  faturamentoSemana: number;
  ticketMedioMes: number;
  taxaCancelamentoMes: number;
};

export async function obterResumoDashboard(): Promise<ResumoDashboard> {
  const [atendimentosHoje, novosClientes, faturamentoSemana, resumoMes, faturamentoMes] =
    await Promise.all([
      pool.query<{ total: string }>(
        `SELECT COUNT(*)::text AS total
         FROM agendamentos
         WHERE data_hora_inicio::date = CURRENT_DATE
           AND status <> 'cancelado'`,
      ),
      pool.query<{ total: string }>(
        `SELECT COUNT(*)::text AS total
         FROM clientes c
         JOIN usuarios u ON u.id = c.usuario_id
         WHERE u.created_at >= date_trunc('week', now())`,
      ),
      // Sessões pagas por pacote não entram a preço cheio: o dinheiro é
      // contabilizado uma vez, na semana em que o pacote foi vendido.
      pool.query<{ total: string | null }>(
        `SELECT (
           COALESCE((
             SELECT SUM(s.valor)
             FROM agendamentos a
             JOIN servicos s ON s.id = a.servico_id
             WHERE a.data_hora_inicio >= date_trunc('week', now())
               AND a.status IN ('confirmado', 'concluido')
               AND a.pacote_cliente_id IS NULL
           ), 0)
           +
           COALESCE((
             SELECT SUM(pc.valor)
             FROM pacotes_cliente pc
             WHERE pc.created_at >= date_trunc('week', now())
               AND pc.ativo = true
           ), 0)
         )::text AS total`,
      ),
      pool.query<{ atendimentos_mes: string; cancelados_mes: string; total_mes: string }>(
        `SELECT
           COUNT(*) FILTER (WHERE status <> 'cancelado')::text AS atendimentos_mes,
           COUNT(*) FILTER (WHERE status = 'cancelado')::text AS cancelados_mes,
           COUNT(*)::text AS total_mes
         FROM agendamentos
         WHERE data_hora_inicio >= date_trunc('month', now())
           AND data_hora_inicio < date_trunc('month', now()) + interval '1 month'`,
      ),
      pool.query<{ total: string | null }>(
        `SELECT (
           COALESCE((
             SELECT SUM(s.valor)
             FROM agendamentos a
             JOIN servicos s ON s.id = a.servico_id
             WHERE a.data_hora_inicio >= date_trunc('month', now())
               AND a.data_hora_inicio < date_trunc('month', now()) + interval '1 month'
               AND a.status IN ('confirmado', 'concluido')
               AND a.pacote_cliente_id IS NULL
           ), 0)
           +
           COALESCE((
             SELECT SUM(pc.valor)
             FROM pacotes_cliente pc
             WHERE pc.created_at >= date_trunc('month', now())
               AND pc.created_at < date_trunc('month', now()) + interval '1 month'
               AND pc.ativo = true
           ), 0)
         )::text AS total`,
      ),
    ]);

  const atendimentosMes = Number(resumoMes.rows[0]?.atendimentos_mes ?? 0);
  const canceladosMes = Number(resumoMes.rows[0]?.cancelados_mes ?? 0);
  const totalMes = Number(resumoMes.rows[0]?.total_mes ?? 0);
  const totalFaturamentoMes = Number(faturamentoMes.rows[0]?.total ?? 0);

  return {
    atendimentosHoje: Number(atendimentosHoje.rows[0]?.total ?? 0),
    atendimentosMes,
    novosClientesSemana: Number(novosClientes.rows[0]?.total ?? 0),
    faturamentoSemana: Number(faturamentoSemana.rows[0]?.total ?? 0),
    ticketMedioMes: atendimentosMes > 0 ? totalFaturamentoMes / atendimentosMes : 0,
    taxaCancelamentoMes: totalMes > 0 ? (canceladosMes / totalMes) * 100 : 0,
  };
}

export type FaturamentoDia = {
  data: string;
  total: number;
};

export async function obterFaturamentoDiario(dias = 14): Promise<FaturamentoDia[]> {
  const result = await pool.query<{ dia: string; total: string }>(
    `WITH dias AS (
       SELECT generate_series(CURRENT_DATE - ($1::int - 1), CURRENT_DATE, interval '1 day')::date AS dia
     ),
     avulso AS (
       SELECT a.data_hora_inicio::date AS dia, SUM(s.valor) AS total
       FROM agendamentos a
       JOIN servicos s ON s.id = a.servico_id
       WHERE a.status IN ('confirmado', 'concluido')
         AND a.pacote_cliente_id IS NULL
         AND a.data_hora_inicio::date >= CURRENT_DATE - ($1::int - 1)
       GROUP BY 1
     ),
     pacotes AS (
       SELECT pc.created_at::date AS dia, SUM(pc.valor) AS total
       FROM pacotes_cliente pc
       WHERE pc.ativo = true
         AND pc.created_at::date >= CURRENT_DATE - ($1::int - 1)
       GROUP BY 1
     )
     SELECT d.dia::text AS dia, (COALESCE(a.total, 0) + COALESCE(p.total, 0))::text AS total
     FROM dias d
     LEFT JOIN avulso a ON a.dia = d.dia
     LEFT JOIN pacotes p ON p.dia = d.dia
     ORDER BY d.dia ASC`,
    [dias],
  );

  return result.rows.map((row) => ({
    data: row.dia,
    total: Number(row.total),
  }));
}

export type AgendamentosPorStatus = {
  status: StatusAgendamento;
  total: number;
};

const ORDEM_STATUS: StatusAgendamento[] = ["pendente", "confirmado", "concluido", "cancelado"];

export async function obterAgendamentosPorStatusMes(): Promise<AgendamentosPorStatus[]> {
  const result = await pool.query<{ status: StatusAgendamento; total: string }>(
    `SELECT status, COUNT(*)::text AS total
     FROM agendamentos
     WHERE data_hora_inicio >= date_trunc('month', now())
       AND data_hora_inicio < date_trunc('month', now()) + interval '1 month'
     GROUP BY status`,
  );

  const totais = new Map(result.rows.map((row) => [row.status, Number(row.total)]));

  return ORDEM_STATUS.map((status) => ({
    status,
    total: totais.get(status) ?? 0,
  }));
}

export type ServicoMaisVendido = {
  nome: string;
  total: number;
};

export async function obterServicosMaisVendidosMes(limite = 6): Promise<ServicoMaisVendido[]> {
  const result = await pool.query<{ nome: string; total: string }>(
    `SELECT s.nome, COUNT(*)::text AS total
     FROM agendamentos a
     JOIN servicos s ON s.id = a.servico_id
     WHERE a.data_hora_inicio >= date_trunc('month', now())
       AND a.data_hora_inicio < date_trunc('month', now()) + interval '1 month'
       AND a.status <> 'cancelado'
     GROUP BY s.nome
     ORDER BY COUNT(*) DESC, s.nome ASC
     LIMIT $1`,
    [limite],
  );

  return result.rows.map((row) => ({
    nome: row.nome,
    total: Number(row.total),
  }));
}

export type ProximoAgendamento = {
  id: string;
  clienteNome: string;
  servicoNome: string;
  dataHoraInicio: string;
  status: string;
};

export async function obterProximosAgendamentos(limite = 5): Promise<ProximoAgendamento[]> {
  const result = await pool.query<{
    id: string;
    cliente_nome: string;
    servico_nome: string;
    data_hora_inicio: string;
    status: string;
  }>(
    `SELECT a.id, u.nome AS cliente_nome, s.nome AS servico_nome, a.data_hora_inicio, a.status
     FROM agendamentos a
     JOIN clientes c ON c.id = a.cliente_id
     JOIN usuarios u ON u.id = c.usuario_id
     JOIN servicos s ON s.id = a.servico_id
     WHERE a.data_hora_inicio >= now()
       AND a.status IN ('pendente', 'confirmado')
     ORDER BY a.data_hora_inicio ASC
     LIMIT $1`,
    [limite],
  );

  return result.rows.map((row) => ({
    id: row.id,
    clienteNome: row.cliente_nome,
    servicoNome: row.servico_nome,
    dataHoraInicio: row.data_hora_inicio,
    status: row.status,
  }));
}

export async function obterNomeUsuario(usuarioId: string): Promise<string | null> {
  const result = await pool.query<{ nome: string }>("SELECT nome FROM usuarios WHERE id = $1", [
    usuarioId,
  ]);
  return result.rows[0]?.nome ?? null;
}
