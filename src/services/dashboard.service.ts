import { pool } from "@/db/client";

export type ResumoDashboard = {
  atendimentosHoje: number;
  novosClientesSemana: number;
  faturamentoSemana: number;
};

export async function obterResumoDashboard(): Promise<ResumoDashboard> {
  const [atendimentosHoje, novosClientes, faturamento] = await Promise.all([
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
    pool.query<{ total: string | null }>(
      `SELECT SUM(s.valor)::text AS total
       FROM agendamentos a
       JOIN servicos s ON s.id = a.servico_id
       WHERE a.data_hora_inicio >= date_trunc('week', now())
         AND a.status IN ('confirmado', 'concluido')`,
    ),
  ]);

  return {
    atendimentosHoje: Number(atendimentosHoje.rows[0]?.total ?? 0),
    novosClientesSemana: Number(novosClientes.rows[0]?.total ?? 0),
    faturamentoSemana: Number(faturamento.rows[0]?.total ?? 0),
  };
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
