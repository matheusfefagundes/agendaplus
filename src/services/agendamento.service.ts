import { pool } from "@/db/client";
import {
  adicionarDias,
  diaDaSemana,
  formatarHoraDeMinutos,
  hojeEmSaoPauloISO,
  inicioDoDiaBrasil,
  minutosDeHoraTexto,
  minutosDoDiaBrasil,
} from "@/utils/data";
import type { AgendamentoDetalhe, StatusAgendamento } from "@/types/agendamento";

export class TransicaoInvalidaError extends Error {}
export class HorarioIndisponivelError extends Error {}

const GRANULARIDADE_MINUTOS = 15;

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

type Intervalo = { inicio: number; fim: number };

function conflitam(a: Intervalo, intervalos: Intervalo[]): boolean {
  return intervalos.some((b) => a.inicio < b.fim && a.fim > b.inicio);
}

// Calcula os horários de início disponíveis para um serviço num dia, cruzando
// a grade semanal (horarios_disponibilidade) com o que já está ocupado
// (agendamentos pendentes/confirmados, com o intervalo_minutos como buffer
// de folga) e com bloqueios pontuais (bloqueios_agenda).
export async function calcularHorariosDisponiveis(
  dataISO: string,
  servicoId: string,
): Promise<string[]> {
  const servicoResult = await pool.query<{ duracao_minutos: number }>(
    "SELECT duracao_minutos FROM servicos WHERE id = $1 AND ativo = true",
    [servicoId],
  );
  const duracao = servicoResult.rows[0]?.duracao_minutos;
  if (!duracao) return [];

  const dow = diaDaSemana(dataISO);
  const janelasResult = await pool.query<{
    hora_inicio: string;
    hora_fim: string;
    intervalo_minutos: number;
  }>(
    "SELECT hora_inicio, hora_fim, intervalo_minutos FROM horarios_disponibilidade WHERE dia_semana = $1 AND ativo = true",
    [dow],
  );
  if (janelasResult.rows.length === 0) return [];

  const inicioDoDia = inicioDoDiaBrasil(dataISO);
  const fimDoDia = inicioDoDiaBrasil(adicionarDias(dataISO, 1));

  const [ocupadosResult, bloqueiosResult] = await Promise.all([
    pool.query<{ data_hora_inicio: Date; data_hora_fim: Date }>(
      `SELECT data_hora_inicio, data_hora_fim FROM agendamentos
       WHERE status IN ('pendente', 'confirmado')
         AND data_hora_inicio < $2 AND data_hora_fim > $1`,
      [inicioDoDia, fimDoDia],
    ),
    pool.query<{ data_hora_inicio: Date; data_hora_fim: Date }>(
      `SELECT data_hora_inicio, data_hora_fim FROM bloqueios_agenda
       WHERE data_hora_inicio < $2 AND data_hora_fim > $1`,
      [inicioDoDia, fimDoDia],
    ),
  ]);

  const buffer = Math.max(0, ...janelasResult.rows.map((j) => j.intervalo_minutos));

  const ocupados: Intervalo[] = ocupadosResult.rows.map((r) => ({
    inicio: minutosDoDiaBrasil(r.data_hora_inicio.toISOString()) - buffer,
    fim: minutosDoDiaBrasil(r.data_hora_fim.toISOString()) + buffer,
  }));
  const bloqueios: Intervalo[] = bloqueiosResult.rows.map((r) => ({
    inicio: minutosDoDiaBrasil(r.data_hora_inicio.toISOString()),
    fim: minutosDoDiaBrasil(r.data_hora_fim.toISOString()),
  }));
  const ocupadosEBloqueios = [...ocupados, ...bloqueios];

  const agora = dataISO === hojeEmSaoPauloISO() ? minutosDoDiaBrasil(new Date().toISOString()) : -1;

  const disponiveis = new Set<string>();
  for (const janela of janelasResult.rows) {
    const inicioJanela = minutosDeHoraTexto(janela.hora_inicio);
    const fimJanela = minutosDeHoraTexto(janela.hora_fim);

    for (let inicio = inicioJanela; inicio + duracao <= fimJanela; inicio += GRANULARIDADE_MINUTOS) {
      if (inicio <= agora) continue;
      if (conflitam({ inicio, fim: inicio + duracao }, ocupadosEBloqueios)) continue;
      disponiveis.add(formatarHoraDeMinutos(inicio));
    }
  }

  return [...disponiveis].sort();
}

export async function criarAgendamento(input: {
  clienteId: string;
  servicoId: string;
  data: string;
  horario: string;
  observacoes?: string | null;
}): Promise<AgendamentoDetalhe> {
  const servicoResult = await pool.query<{ duracao_minutos: number }>(
    "SELECT duracao_minutos FROM servicos WHERE id = $1 AND ativo = true",
    [input.servicoId],
  );
  const duracao = servicoResult.rows[0]?.duracao_minutos;
  if (!duracao) {
    throw new HorarioIndisponivelError("Serviço não encontrado ou inativo.");
  }

  const dataHoraInicio = new Date(`${input.data}T${input.horario}:00-03:00`);
  const dataHoraFim = new Date(dataHoraInicio.getTime() + duracao * 60_000);

  try {
    const result = await pool.query<{ id: string }>(
      `INSERT INTO agendamentos (cliente_id, servico_id, data_hora_inicio, data_hora_fim, status, observacoes)
       VALUES ($1, $2, $3, $4, 'confirmado', $5)
       RETURNING id`,
      [input.clienteId, input.servicoId, dataHoraInicio, dataHoraFim, input.observacoes ?? null],
    );
    const row = await pool.query<AgendamentoRow>(`${SELECT_BASE} WHERE a.id = $1`, [result.rows[0].id]);
    return mapRow(row.rows[0]);
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "23P01") {
      throw new HorarioIndisponivelError("Esse horário acabou de ser reservado. Escolha outro horário.");
    }
    throw error;
  }
}
