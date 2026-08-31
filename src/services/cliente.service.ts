import { pool } from "@/db/client";
import type { ClienteDetalhe } from "@/types/cliente";

export type { ClienteDetalhe } from "@/types/cliente";

type ClienteRow = {
  id: string;
  nome: string;
  email: string;
  telefone: string | null;
  data_nascimento: string | Date | null;
  observacoes_clinicas: string | null;
  ativo: boolean;
};

function formatarData(valor: string | Date | null): string | null {
  if (!valor) return null;
  const data = valor instanceof Date ? valor : new Date(valor);
  return data.toISOString().slice(0, 10);
}

function mapRow(row: ClienteRow): ClienteDetalhe {
  return {
    id: row.id,
    nome: row.nome,
    email: row.email,
    telefone: row.telefone,
    dataNascimento: formatarData(row.data_nascimento),
    observacoesClinicas: row.observacoes_clinicas,
    ativo: row.ativo,
  };
}

const SELECT_BASE = `
  SELECT c.id, u.nome, u.email, c.telefone, c.data_nascimento, c.observacoes_clinicas, c.ativo
  FROM clientes c
  JOIN usuarios u ON u.id = c.usuario_id
`;

export async function listarClientes(): Promise<ClienteDetalhe[]> {
  const result = await pool.query<ClienteRow>(`${SELECT_BASE} ORDER BY u.nome ASC`);
  return result.rows.map(mapRow);
}

export async function obterClientePorId(id: string): Promise<ClienteDetalhe | null> {
  const result = await pool.query<ClienteRow>(`${SELECT_BASE} WHERE c.id = $1`, [id]);
  return result.rows[0] ? mapRow(result.rows[0]) : null;
}

export async function obterClientePorUsuarioId(usuarioId: string): Promise<ClienteDetalhe | null> {
  const result = await pool.query<ClienteRow>(`${SELECT_BASE} WHERE c.usuario_id = $1`, [usuarioId]);
  return result.rows[0] ? mapRow(result.rows[0]) : null;
}

export async function atualizarCliente(
  id: string,
  input: Partial<{
    telefone: string | null;
    dataNascimento: string | null;
    observacoesClinicas: string | null;
    ativo: boolean;
  }>,
): Promise<ClienteDetalhe | null> {
  const campos: string[] = [];
  const valores: unknown[] = [];
  let i = 1;

  if (input.telefone !== undefined) {
    campos.push(`telefone = $${i++}`);
    valores.push(input.telefone);
  }
  if (input.dataNascimento !== undefined) {
    campos.push(`data_nascimento = $${i++}`);
    valores.push(input.dataNascimento);
  }
  if (input.observacoesClinicas !== undefined) {
    campos.push(`observacoes_clinicas = $${i++}`);
    valores.push(input.observacoesClinicas);
  }
  if (input.ativo !== undefined) {
    campos.push(`ativo = $${i++}`);
    valores.push(input.ativo);
  }

  if (campos.length > 0) {
    valores.push(id);
    await pool.query(`UPDATE clientes SET ${campos.join(", ")} WHERE id = $${i}`, valores);
  }

  return obterClientePorId(id);
}
