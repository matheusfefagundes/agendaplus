import { pool } from "@/db/client";
import type { Horario } from "@/types/horario";

export type { Horario } from "@/types/horario";

export class HorarioConflitoError extends Error {}
export class HorarioOcupadoError extends Error {}

type HorarioRow = {
  id: string;
  dia_semana: number;
  hora_inicio: string;
  hora_fim: string;
  intervalo_minutos: number;
  ativo: boolean;
};

function mapRow(row: HorarioRow): Horario {
  return {
    id: row.id,
    diaSemana: row.dia_semana,
    horaInicio: row.hora_inicio,
    horaFim: row.hora_fim,
    intervaloMinutos: row.intervalo_minutos,
    ativo: row.ativo,
  };
}

const COLUNAS = "id, dia_semana, hora_inicio, hora_fim, intervalo_minutos, ativo";

const MENSAGEM_HORARIO_OCUPADO =
  "Não é possível alterar, existem agendamentos marcados dentro desse horário. Cancele ou remaneje-os antes de editar a janela.";

async function comTratamentoDeConflito<T>(fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "23P01") {
      throw new HorarioConflitoError(
        "Esse horário conflita com outra janela já cadastrada nesse dia da semana.",
      );
    }
    throw error;
  }
}

async function existeAgendamentoNaJanela(
  diaSemana: number,
  horaInicio: string,
  horaFim: string,
): Promise<boolean> {
  const result = await pool.query(
    `SELECT 1
     FROM agendamentos
     WHERE status IN ('pendente', 'confirmado')
       AND EXTRACT(DOW FROM (data_hora_inicio AT TIME ZONE 'America/Sao_Paulo')) = $1
       AND (data_hora_inicio AT TIME ZONE 'America/Sao_Paulo')::time >= $2::time
       AND (data_hora_inicio AT TIME ZONE 'America/Sao_Paulo')::time < $3::time
     LIMIT 1`,
    [diaSemana, horaInicio, horaFim],
  );
  return (result.rowCount ?? 0) > 0;
}

export async function listarHorarios(): Promise<Horario[]> {
  const result = await pool.query<HorarioRow>(
    `SELECT ${COLUNAS} FROM horarios_disponibilidade ORDER BY dia_semana ASC, hora_inicio ASC`,
  );
  return result.rows.map(mapRow);
}

export async function criarHorario(input: {
  diaSemana: number;
  horaInicio: string;
  horaFim: string;
  intervaloMinutos: number;
}): Promise<Horario> {
  return comTratamentoDeConflito(async () => {
    const result = await pool.query<HorarioRow>(
      `INSERT INTO horarios_disponibilidade (dia_semana, hora_inicio, hora_fim, intervalo_minutos)
       VALUES ($1, $2, $3, $4)
       RETURNING ${COLUNAS}`,
      [input.diaSemana, input.horaInicio, input.horaFim, input.intervaloMinutos],
    );
    return mapRow(result.rows[0]);
  });
}

export async function atualizarHorario(
  id: string,
  input: Partial<{
    horaInicio: string;
    horaFim: string;
    intervaloMinutos: number;
    ativo: boolean;
  }>,
): Promise<Horario | null> {
  return comTratamentoDeConflito(async () => {
    const atual = await pool.query<HorarioRow>(
      `SELECT ${COLUNAS} FROM horarios_disponibilidade WHERE id = $1`,
      [id],
    );
    const horarioAtual = atual.rows[0];
    if (!horarioAtual) return null;

    const alterandoHorario = input.horaInicio !== undefined || input.horaFim !== undefined;
    if (alterandoHorario) {
      const ocupado = await existeAgendamentoNaJanela(
        horarioAtual.dia_semana,
        horarioAtual.hora_inicio,
        horarioAtual.hora_fim,
      );
      if (ocupado) {
        throw new HorarioOcupadoError(MENSAGEM_HORARIO_OCUPADO);
      }
    }

    const campos: string[] = [];
    const valores: unknown[] = [];
    let i = 1;

    if (input.horaInicio !== undefined) {
      campos.push(`hora_inicio = $${i++}`);
      valores.push(input.horaInicio);
    }
    if (input.horaFim !== undefined) {
      campos.push(`hora_fim = $${i++}`);
      valores.push(input.horaFim);
    }
    if (input.intervaloMinutos !== undefined) {
      campos.push(`intervalo_minutos = $${i++}`);
      valores.push(input.intervaloMinutos);
    }
    if (input.ativo !== undefined) {
      campos.push(`ativo = $${i++}`);
      valores.push(input.ativo);
    }

    if (campos.length === 0) {
      return mapRow(horarioAtual);
    }

    valores.push(id);
    const result = await pool.query<HorarioRow>(
      `UPDATE horarios_disponibilidade SET ${campos.join(", ")} WHERE id = $${i} RETURNING ${COLUNAS}`,
      valores,
    );
    return result.rows[0] ? mapRow(result.rows[0]) : null;
  });
}

export async function removerHorario(id: string): Promise<void> {
  const atual = await pool.query<HorarioRow>(
    `SELECT ${COLUNAS} FROM horarios_disponibilidade WHERE id = $1`,
    [id],
  );
  const horarioAtual = atual.rows[0];
  if (!horarioAtual) return;

  const ocupado = await existeAgendamentoNaJanela(
    horarioAtual.dia_semana,
    horarioAtual.hora_inicio,
    horarioAtual.hora_fim,
  );
  if (ocupado) {
    throw new HorarioOcupadoError(MENSAGEM_HORARIO_OCUPADO);
  }

  await pool.query("DELETE FROM horarios_disponibilidade WHERE id = $1", [id]);
}
