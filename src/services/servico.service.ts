import { pool } from "@/db/client";
import type { Servico } from "@/types/servico";

export type { Servico } from "@/types/servico";

export class ServicoVinculadoError extends Error {}

type ServicoRow = {
  id: string;
  nome: string;
  descricao: string | null;
  duracao_minutos: number;
  valor: string;
  ativo: boolean;
};

function mapRow(row: ServicoRow): Servico {
  return {
    id: row.id,
    nome: row.nome,
    descricao: row.descricao,
    duracaoMinutos: row.duracao_minutos,
    valor: Number(row.valor),
    ativo: row.ativo,
  };
}

const COLUNAS = "id, nome, descricao, duracao_minutos, valor, ativo";

export async function listarServicos(): Promise<Servico[]> {
  const result = await pool.query<ServicoRow>(
    `SELECT ${COLUNAS} FROM servicos ORDER BY ativo DESC, nome ASC`,
  );
  return result.rows.map(mapRow);
}

export async function criarServico(input: {
  nome: string;
  descricao?: string | null;
  duracaoMinutos: number;
  valor: number;
}): Promise<Servico> {
  const result = await pool.query<ServicoRow>(
    `INSERT INTO servicos (nome, descricao, duracao_minutos, valor)
     VALUES ($1, $2, $3, $4)
     RETURNING ${COLUNAS}`,
    [input.nome, input.descricao ?? null, input.duracaoMinutos, input.valor],
  );
  return mapRow(result.rows[0]);
}

export async function atualizarServico(
  id: string,
  input: Partial<{
    nome: string;
    descricao: string | null;
    duracaoMinutos: number;
    valor: number;
    ativo: boolean;
  }>,
): Promise<Servico | null> {
  const campos: string[] = [];
  const valores: unknown[] = [];
  let i = 1;

  if (input.nome !== undefined) {
    campos.push(`nome = $${i++}`);
    valores.push(input.nome);
  }
  if (input.descricao !== undefined) {
    campos.push(`descricao = $${i++}`);
    valores.push(input.descricao);
  }
  if (input.duracaoMinutos !== undefined) {
    campos.push(`duracao_minutos = $${i++}`);
    valores.push(input.duracaoMinutos);
  }
  if (input.valor !== undefined) {
    campos.push(`valor = $${i++}`);
    valores.push(input.valor);
  }
  if (input.ativo !== undefined) {
    campos.push(`ativo = $${i++}`);
    valores.push(input.ativo);
  }

  if (campos.length === 0) {
    const atual = await pool.query<ServicoRow>(`SELECT ${COLUNAS} FROM servicos WHERE id = $1`, [id]);
    return atual.rows[0] ? mapRow(atual.rows[0]) : null;
  }

  valores.push(id);
  const result = await pool.query<ServicoRow>(
    `UPDATE servicos SET ${campos.join(", ")} WHERE id = $${i} RETURNING ${COLUNAS}`,
    valores,
  );
  return result.rows[0] ? mapRow(result.rows[0]) : null;
}

const MENSAGEM_SERVICO_VINCULADO =
  "Não é possível excluir esse serviço pois existem agendamentos vinculados a ele.";

export async function excluirServico(id: string): Promise<void> {
  const vinculo = await pool.query("SELECT 1 FROM agendamentos WHERE servico_id = $1 LIMIT 1", [id]);
  if ((vinculo.rowCount ?? 0) > 0) {
    throw new ServicoVinculadoError(MENSAGEM_SERVICO_VINCULADO);
  }

  try {
    await pool.query("DELETE FROM servicos WHERE id = $1", [id]);
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "23503") {
      throw new ServicoVinculadoError(MENSAGEM_SERVICO_VINCULADO);
    }
    throw error;
  }
}
