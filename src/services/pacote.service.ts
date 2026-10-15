import type { PoolClient } from "pg";
import { pool } from "@/db/client";
import type { Pacote, ServicoDoPacote } from "@/types/pacote";

export type { Pacote } from "@/types/pacote";

export class PacoteVinculadoError extends Error {}
export class PacoteInvalidoError extends Error {}

type PacoteRow = {
  id: string;
  servicos: ServicoDoPacote[];
  quantidade_sessoes: number;
  valor: string;
  validade_dias: number;
  ativo: boolean;
};

function mapRow(row: PacoteRow): Pacote {
  return {
    id: row.id,
    servicos: row.servicos,
    quantidadeSessoes: row.quantidade_sessoes,
    valor: Number(row.valor),
    validadeDias: row.validade_dias,
    ativo: row.ativo,
  };
}

const SELECT_BASE = `
  SELECT p.id, COALESCE(sv.servicos, '[]'::json) AS servicos, p.quantidade_sessoes, p.valor,
         p.validade_dias, p.ativo
  FROM pacotes p
  LEFT JOIN LATERAL (
    SELECT json_agg(json_build_object('id', s.id, 'nome', s.nome) ORDER BY s.nome) AS servicos,
           string_agg(s.nome, ' + ' ORDER BY s.nome) AS nomes
    FROM pacotes_servicos ps
    JOIN servicos s ON s.id = ps.servico_id
    WHERE ps.pacote_id = p.id
  ) sv ON true
`;

export async function listarPacotes(): Promise<Pacote[]> {
  const result = await pool.query<PacoteRow>(
    `${SELECT_BASE} ORDER BY p.ativo DESC, sv.nomes ASC, p.quantidade_sessoes ASC`,
  );
  return result.rows.map(mapRow);
}

export async function obterPacotePorId(id: string): Promise<Pacote | null> {
  const result = await pool.query<PacoteRow>(`${SELECT_BASE} WHERE p.id = $1`, [id]);
  return result.rows[0] ? mapRow(result.rows[0]) : null;
}

async function garantirServicosExistem(client: PoolClient, servicoIds: string[]): Promise<void> {
  const result = await client.query<{ total: number }>(
    "SELECT COUNT(*)::int AS total FROM servicos WHERE id = ANY($1::uuid[])",
    [servicoIds],
  );
  if (result.rows[0].total !== servicoIds.length) {
    throw new PacoteInvalidoError("Serviço não encontrado.");
  }
}

async function definirServicos(client: PoolClient, pacoteId: string, servicoIds: string[]): Promise<void> {
  await client.query("DELETE FROM pacotes_servicos WHERE pacote_id = $1", [pacoteId]);
  await client.query(
    `INSERT INTO pacotes_servicos (pacote_id, servico_id)
     SELECT $1, UNNEST($2::uuid[])`,
    [pacoteId, servicoIds],
  );
}

async function emTransacao<T>(acao: (client: PoolClient) => Promise<T>): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const resultado = await acao(client);
    await client.query("COMMIT");
    return resultado;
  } catch (error) {
    await client.query("ROLLBACK").catch(() => undefined);
    throw error;
  } finally {
    client.release();
  }
}

export async function criarPacote(input: {
  servicoIds: string[];
  quantidadeSessoes: number;
  valor: number;
  validadeDias: number;
}): Promise<Pacote> {
  const servicoIds = [...new Set(input.servicoIds)];

  const id = await emTransacao(async (client) => {
    await garantirServicosExistem(client, servicoIds);
    const result = await client.query<{ id: string }>(
      `INSERT INTO pacotes (quantidade_sessoes, valor, validade_dias)
       VALUES ($1, $2, $3)
       RETURNING id`,
      [input.quantidadeSessoes, input.valor, input.validadeDias],
    );
    await definirServicos(client, result.rows[0].id, servicoIds);
    return result.rows[0].id;
  });

  return (await obterPacotePorId(id)) as Pacote;
}

export async function atualizarPacote(
  id: string,
  input: Partial<{
    servicoIds: string[];
    quantidadeSessoes: number;
    valor: number;
    validadeDias: number;
    ativo: boolean;
  }>,
): Promise<Pacote | null> {
  const campos: string[] = [];
  const valores: unknown[] = [];
  let i = 1;

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

  const encontrado = await emTransacao(async (client) => {
    const existe = await client.query("SELECT 1 FROM pacotes WHERE id = $1 FOR UPDATE", [id]);
    if ((existe.rowCount ?? 0) === 0) return false;

    if (campos.length > 0) {
      await client.query(`UPDATE pacotes SET ${campos.join(", ")} WHERE id = $${i}`, [...valores, id]);
    }
    if (input.servicoIds !== undefined) {
      const servicoIds = [...new Set(input.servicoIds)];
      await garantirServicosExistem(client, servicoIds);
      await definirServicos(client, id, servicoIds);
    }
    return true;
  });

  return encontrado ? obterPacotePorId(id) : null;
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
