import { pool } from "@/db/client";
import type { Pacote } from "@/types/pacote";

export type { Pacote } from "@/types/pacote";

export class PacoteVinculadoError extends Error {}
export class PacoteInvalidoError extends Error {}

type PacoteRow = {
  id: string;
  servico_id: string;
  servico_nome: string;
  quantidade_sessoes: number;
  valor: string;
  validade_dias: number;
  ativo: boolean;
};

function mapRow(row: PacoteRow): Pacote {
  return {
    id: row.id,
    servicoId: row.servico_id,
    servicoNome: row.servico_nome,
    quantidadeSessoes: row.quantidade_sessoes,
    valor: Number(row.valor),
    validadeDias: row.validade_dias,
    ativo: row.ativo,
  };
}

const SELECT_BASE = `
  SELECT p.id, p.servico_id, s.nome AS servico_nome, p.quantidade_sessoes, p.valor, p.validade_dias, p.ativo
  FROM pacotes p
  JOIN servicos s ON s.id = p.servico_id
`;

export async function listarPacotes(): Promise<Pacote[]> {
  const result = await pool.query<PacoteRow>(
    `${SELECT_BASE} ORDER BY p.ativo DESC, s.nome ASC, p.quantidade_sessoes ASC`,
  );
  return result.rows.map(mapRow);
}

export async function obterPacotePorId(id: string): Promise<Pacote | null> {
  const result = await pool.query<PacoteRow>(`${SELECT_BASE} WHERE p.id = $1`, [id]);
  return result.rows[0] ? mapRow(result.rows[0]) : null;
}

async function garantirServicoExiste(servicoId: string): Promise<void> {
  const servico = await pool.query("SELECT 1 FROM servicos WHERE id = $1", [servicoId]);
  if ((servico.rowCount ?? 0) === 0) {
    throw new PacoteInvalidoError("Serviço não encontrado.");
  }
}

export async function criarPacote(input: {
  servicoId: string;
  quantidadeSessoes: number;
  valor: number;
  validadeDias: number;
}): Promise<Pacote> {
  await garantirServicoExiste(input.servicoId);

  const result = await pool.query<{ id: string }>(
    `INSERT INTO pacotes (servico_id, quantidade_sessoes, valor, validade_dias)
     VALUES ($1, $2, $3, $4)
     RETURNING id`,
    [input.servicoId, input.quantidadeSessoes, input.valor, input.validadeDias],
  );
  return (await obterPacotePorId(result.rows[0].id)) as Pacote;
}

export async function atualizarPacote(
  id: string,
  input: Partial<{
    servicoId: string;
    quantidadeSessoes: number;
    valor: number;
    validadeDias: number;
    ativo: boolean;
  }>,
): Promise<Pacote | null> {
  if (input.servicoId !== undefined) {
    await garantirServicoExiste(input.servicoId);
  }

  const campos: string[] = [];
  const valores: unknown[] = [];
  let i = 1;

  if (input.servicoId !== undefined) {
    campos.push(`servico_id = $${i++}`);
    valores.push(input.servicoId);
  }
  if (input.quantidadeSessoes !== undefined) {
    campos.push(`quantidade_sessoes = $${i++}`);
    valores.push(input.quantidadeSessoes);
  }
  if (input.valor !== undefined) {
    campos.push(`valor = $${i++}`);
    valores.push(input.valor);
  }
  if (input.validadeDias !== undefined) {
    campos.push(`validade_dias = $${i++}`);
    valores.push(input.validadeDias);
  }
  if (input.ativo !== undefined) {
    campos.push(`ativo = $${i++}`);
    valores.push(input.ativo);
  }

  if (campos.length > 0) {
    valores.push(id);
    const result = await pool.query(`UPDATE pacotes SET ${campos.join(", ")} WHERE id = $${i}`, valores);
    if ((result.rowCount ?? 0) === 0) return null;
  }

  return obterPacotePorId(id);
}

const MENSAGEM_PACOTE_VINCULADO =
  "Não é possível excluir esse pacote pois ele já foi atribuído a clientes. Desative-o para não ser mais oferecido.";

export async function excluirPacote(id: string): Promise<void> {
  const vinculo = await pool.query("SELECT 1 FROM pacotes_cliente WHERE pacote_id = $1 LIMIT 1", [id]);
  if ((vinculo.rowCount ?? 0) > 0) {
    throw new PacoteVinculadoError(MENSAGEM_PACOTE_VINCULADO);
  }

  try {
    await pool.query("DELETE FROM pacotes WHERE id = $1", [id]);
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "23503") {
      throw new PacoteVinculadoError(MENSAGEM_PACOTE_VINCULADO);
    }
    throw error;
  }
}
