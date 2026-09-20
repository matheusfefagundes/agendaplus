import type { PoolClient } from "pg";
import { pool } from "@/db/client";
import { PacoteInvalidoError } from "@/services/pacote.service";
import type { PacoteCliente, SituacaoPacoteCliente } from "@/types/pacote";

export type { PacoteCliente } from "@/types/pacote";

type PacoteClienteRow = {
  id: string;
  cliente_id: string;
  pacote_id: string;
  servico_id: string;
  servico_nome: string;
  quantidade_sessoes: number;
  sessoes_usadas: number;
  valor: string;
  expira_em: string;
  expirado: boolean;
  ativo: boolean;
};

const HOJE_SAO_PAULO = "(now() AT TIME ZONE 'America/Sao_Paulo')::date";

function calcularSituacao(row: PacoteClienteRow): SituacaoPacoteCliente {
  if (!row.ativo) return "cancelado";
  if (row.sessoes_usadas >= row.quantidade_sessoes) return "esgotado";
  if (row.expirado) return "expirado";
  return "ativo";
}

function mapRow(row: PacoteClienteRow): PacoteCliente {
  return {
    id: row.id,
    clienteId: row.cliente_id,
    pacoteId: row.pacote_id,
    servicoId: row.servico_id,
    servicoNome: row.servico_nome,
    quantidadeSessoes: row.quantidade_sessoes,
    sessoesUsadas: row.sessoes_usadas,
    sessoesRestantes: Math.max(0, row.quantidade_sessoes - row.sessoes_usadas),
    valor: Number(row.valor),
    expiraEm: row.expira_em,
    ativo: row.ativo,
    situacao: calcularSituacao(row),
  };
}

// O saldo é derivado: sessões usadas = agendamentos do pacote que não foram
// cancelados. Cancelar um agendamento "devolve" a sessão sem nenhum estorno.
const SELECT_BASE = `
  SELECT pc.id, pc.cliente_id, pc.pacote_id, pc.servico_id, s.nome AS servico_nome,
         pc.quantidade_sessoes, pc.valor, pc.expira_em::text AS expira_em, pc.ativo,
         (pc.expira_em < ${HOJE_SAO_PAULO}) AS expirado,
         (SELECT COUNT(*)::int FROM agendamentos a
           WHERE a.pacote_cliente_id = pc.id AND a.status <> 'cancelado') AS sessoes_usadas
  FROM pacotes_cliente pc
  JOIN servicos s ON s.id = pc.servico_id
`;

export async function listarPacotesDoCliente(clienteId: string): Promise<PacoteCliente[]> {
  const result = await pool.query<PacoteClienteRow>(
    `${SELECT_BASE} WHERE pc.cliente_id = $1 ORDER BY pc.created_at DESC`,
    [clienteId],
  );
  return result.rows.map(mapRow);
}

export async function listarPacotesPorClientes(): Promise<Record<string, PacoteCliente[]>> {
  const result = await pool.query<PacoteClienteRow>(`${SELECT_BASE} ORDER BY pc.created_at DESC`);
  const porCliente: Record<string, PacoteCliente[]> = {};
  for (const row of result.rows) {
    (porCliente[row.cliente_id] ??= []).push(mapRow(row));
  }
  return porCliente;
}

async function obterPacoteClientePorId(id: string): Promise<PacoteCliente | null> {
  const result = await pool.query<PacoteClienteRow>(`${SELECT_BASE} WHERE pc.id = $1`, [id]);
  return result.rows[0] ? mapRow(result.rows[0]) : null;
}

// Copia os dados do catálogo no momento da venda, para que editar o pacote
// depois não altere o que o cliente já comprou.
export async function atribuirPacote(clienteId: string, pacoteId: string): Promise<PacoteCliente> {
  const cliente = await pool.query("SELECT 1 FROM clientes WHERE id = $1", [clienteId]);
  if ((cliente.rowCount ?? 0) === 0) {
    throw new PacoteInvalidoError("Cliente não encontrado.");
  }

  const result = await pool.query<{ id: string }>(
    `INSERT INTO pacotes_cliente (cliente_id, pacote_id, servico_id, quantidade_sessoes, valor, expira_em)
     SELECT $1, p.id, p.servico_id, p.quantidade_sessoes, p.valor, ${HOJE_SAO_PAULO} + p.validade_dias
     FROM pacotes p
     WHERE p.id = $2 AND p.ativo = true
     RETURNING id`,
    [clienteId, pacoteId],
  );
  if (result.rows.length === 0) {
    throw new PacoteInvalidoError("Pacote não encontrado ou inativo.");
  }
  return (await obterPacoteClientePorId(result.rows[0].id)) as PacoteCliente;
}

export async function cancelarPacoteCliente(
  clienteId: string,
  pacoteClienteId: string,
): Promise<PacoteCliente | null> {
  const result = await pool.query(
    "UPDATE pacotes_cliente SET ativo = false WHERE id = $1 AND cliente_id = $2",
    [pacoteClienteId, clienteId],
  );
  if ((result.rowCount ?? 0) === 0) return null;
  return obterPacoteClientePorId(pacoteClienteId);
}

// Trava a mesma linha que o agendamento trava ao consumir uma sessão, então o
// ajuste nunca corre em paralelo com uma reserva.
export async function ajustarSessoesPacoteCliente(
  clienteId: string,
  pacoteClienteId: string,
  quantidadeSessoes: number,
): Promise<PacoteCliente | null> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const atual = await client.query<{ ativo: boolean }>(
      "SELECT ativo FROM pacotes_cliente WHERE id = $1 AND cliente_id = $2 FOR UPDATE",
      [pacoteClienteId, clienteId],
    );
    if (atual.rows.length === 0) {
      await client.query("ROLLBACK");
      return null;
    }
    if (!atual.rows[0].ativo) {
      throw new PacoteInvalidoError("Esse pacote foi cancelado e não pode ser ajustado.");
    }

    const usadas = await client.query<{ total: number }>(
      "SELECT COUNT(*)::int AS total FROM agendamentos WHERE pacote_cliente_id = $1 AND status <> 'cancelado'",
      [pacoteClienteId],
    );
    const totalUsadas = usadas.rows[0].total;
    const minimo = Math.max(1, totalUsadas);
    if (quantidadeSessoes < minimo) {
      throw new PacoteInvalidoError(
        totalUsadas > 0
          ? `Esse pacote já tem ${totalUsadas} sessões usadas, então o total não pode ser menor que ${minimo}.`
          : "O pacote precisa ter pelo menos 1 sessão.",
      );
    }

    await client.query("UPDATE pacotes_cliente SET quantidade_sessoes = $1 WHERE id = $2", [
      quantidadeSessoes,
      pacoteClienteId,
    ]);
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK").catch(() => undefined);
    throw error;
  } finally {
    client.release();
  }

  return obterPacoteClientePorId(pacoteClienteId);
}

export async function selecionarPacoteParaConsumo(
  client: PoolClient,
  clienteId: string,
  servicoId: string,
): Promise<string | null> {
  const candidatos = await client.query<{ id: string; quantidade_sessoes: number }>(
    `SELECT id, quantidade_sessoes FROM pacotes_cliente
     WHERE cliente_id = $1 AND servico_id = $2 AND ativo = true AND expira_em >= ${HOJE_SAO_PAULO}
     ORDER BY expira_em ASC, created_at ASC
     FOR UPDATE`,
    [clienteId, servicoId],
  );

  for (const candidato of candidatos.rows) {
    const usadas = await client.query<{ total: number }>(
      "SELECT COUNT(*)::int AS total FROM agendamentos WHERE pacote_cliente_id = $1 AND status <> 'cancelado'",
      [candidato.id],
    );
    if (usadas.rows[0].total < candidato.quantidade_sessoes) return candidato.id;
  }
  return null;
}
