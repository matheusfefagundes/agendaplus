import { pool } from "@/db/client";
import type { AgendamentoDetalhe, StatusAgendamento } from "@/types/agendamento";

export class TransicaoInvalidaError extends Error {}

type AgendamentoRow = {
  id: string;
  cliente_id: string;
  cliente_nome: string;
  servico_id: string;
  servico_nome: string;
  duracao_minutos: number;
  data_hora_inicio: Date;
  data_hora_fim: Date;
  status: StatusAgendamento;
  observacoes: string | null;
};

function mapRow(row: AgendamentoRow): AgendamentoDetalhe {
  return {
    id: row.id,
    clienteId: row.cliente_id,
    clienteNome: row.cliente_nome,
    servicoId: row.servico_id,
    servicoNome: row.servico_nome,
    duracaoMinutos: row.duracao_minutos,
    dataHoraInicio: row.data_hora_inicio.toISOString(),
    dataHoraFim: row.data_hora_fim.toISOString(),
    status: row.status,
    observacoes: row.observacoes,
  };
}

const SELECT_BASE = `
  SELECT a.id, a.cliente_id, u.nome AS cliente_nome, a.servico_id, s.nome AS servico_nome,
         s.duracao_minutos, a.data_hora_inicio, a.data_hora_fim, a.status, a.observacoes
  FROM agendamentos a
  JOIN clientes c ON c.id = a.cliente_id
  JOIN usuarios u ON u.id = c.usuario_id
  JOIN servicos s ON s.id = a.servico_id
`;

export async function listarAgendamentosPeriodo(
  inicio: Date,
  fim: Date,
): Promise<AgendamentoDetalhe[]> {
  const result = await pool.query<AgendamentoRow>(
    `${SELECT_BASE} WHERE a.data_hora_inicio >= $1 AND a.data_hora_inicio < $2 ORDER BY a.data_hora_inicio ASC`,
    [inicio, fim],
  );
  return result.rows.map(mapRow);
}

export async function listarAgendamentosHistorico(): Promise<AgendamentoDetalhe[]> {
  const result = await pool.query<AgendamentoRow>(
    `${SELECT_BASE} WHERE a.status IN ('concluido', 'cancelado') ORDER BY a.data_hora_inicio DESC`,
  );
  return result.rows.map(mapRow);
}

const TRANSICOES_PERMITIDAS: Record<StatusAgendamento, StatusAgendamento[]> = {
  pendente: ["confirmado", "cancelado"],
  confirmado: ["concluido", "cancelado"],
  cancelado: [],
  concluido: [],
};

export async function atualizarStatusAgendamento(
  id: string,
  novoStatus: StatusAgendamento,
): Promise<AgendamentoDetalhe | null> {
  const atual = await pool.query<{ status: StatusAgendamento }>(
    "SELECT status FROM agendamentos WHERE id = $1",
    [id],
  );
  const statusAtual = atual.rows[0]?.status;
  if (!statusAtual) return null;

  if (!TRANSICOES_PERMITIDAS[statusAtual].includes(novoStatus)) {
    throw new TransicaoInvalidaError(
      `Não é possível mudar de "${statusAtual}" para "${novoStatus}".`,
    );
  }

  await pool.query("UPDATE agendamentos SET status = $1 WHERE id = $2", [novoStatus, id]);

  const result = await pool.query<AgendamentoRow>(`${SELECT_BASE} WHERE a.id = $1`, [id]);
  return result.rows[0] ? mapRow(result.rows[0]) : null;
}
