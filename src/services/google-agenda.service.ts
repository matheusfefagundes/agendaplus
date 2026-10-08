import { after } from "next/server";
import { pool } from "@/db/client";
import { obterAgendamentoPorId } from "@/services/agendamento.service";
import { cifrar, decifrar } from "@/utils/criptografia";
import type { AgendamentoDetalhe } from "@/types/agendamento";
import type { IntegracaoGoogleAgenda } from "@/types/google-agenda";

const URL_TOKEN = "https://oauth2.googleapis.com/token";
const URL_EVENTOS = "https://www.googleapis.com/calendar/v3/calendars/primary/events";
const FUSO_HORARIO = "America/Sao_Paulo";

export class IntegracaoRevogadaError extends Error {}

export async function obterIntegracaoGoogleAgenda(): Promise<IntegracaoGoogleAgenda | null> {
  const result = await pool.query<{ email: string; criado_em: Date }>(
    "SELECT email, criado_em FROM integracao_google_agenda",
  );
  const row = result.rows[0];
  return row ? { email: row.email, conectadoEm: row.criado_em.toISOString() } : null;
}

export async function salvarIntegracaoGoogleAgenda(input: {
  usuarioId: string;
  email: string;
  refreshToken: string;
}): Promise<void> {
  // Ao trocar de conta, os eventos antigos ficam na agenda anterior: zera os
  // vínculos para que a sincronização recrie tudo na conta nova.
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query("UPDATE agendamentos SET google_evento_id = NULL WHERE google_evento_id IS NOT NULL");
    await client.query(
      `INSERT INTO integracao_google_agenda (id, usuario_id, email, refresh_token)
       VALUES (true, $1, $2, $3)
       ON CONFLICT (id) DO UPDATE
         SET usuario_id = EXCLUDED.usuario_id, email = EXCLUDED.email,
             refresh_token = EXCLUDED.refresh_token, criado_em = now()`,
      [input.usuarioId, input.email, cifrar(input.refreshToken)],
    );
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK").catch(() => undefined);
    throw error;
  } finally {
    client.release();
  }
}

export async function removerIntegracaoGoogleAgenda(): Promise<void> {
  const result = await pool.query<{ refresh_token: string }>(
    "DELETE FROM integracao_google_agenda RETURNING refresh_token",
  );
  await pool.query("UPDATE agendamentos SET google_evento_id = NULL WHERE google_evento_id IS NOT NULL");

  const refreshToken = result.rows[0]?.refresh_token;
  if (refreshToken) {
    await fetch(`https://oauth2.googleapis.com/revoke?token=${encodeURIComponent(decifrar(refreshToken))}`, {
      method: "POST",
    }).catch((error) => console.error("Erro ao revogar token do Google Agenda:", error));
  }
}

async function obterAccessToken(): Promise<string | null> {
  const result = await pool.query<{ refresh_token: string }>("SELECT refresh_token FROM integracao_google_agenda");
  const refreshToken = result.rows[0]?.refresh_token;
  if (!refreshToken) return null;

  const resposta = await fetch(URL_TOKEN, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID ?? "",
      client_secret: process.env.GOOGLE_CLIENT_SECRET ?? "",
      refresh_token: decifrar(refreshToken),
      grant_type: "refresh_token",
    }),
  });

  if (!resposta.ok) {
    const erro = (await resposta.json().catch(() => ({}))) as { error?: string };
    // invalid_grant: o acesso foi revogado na conta Google — desconecta.
    if (erro.error === "invalid_grant") {
      await pool.query("DELETE FROM integracao_google_agenda");
      throw new IntegracaoRevogadaError("Acesso ao Google Agenda revogado; integração desconectada.");
    }
    throw new Error(`Falha ao renovar token do Google Agenda (${resposta.status}).`);
  }

  const dados = (await resposta.json()) as { access_token: string };
  return dados.access_token;
}

function montarEvento(agendamento: AgendamentoDetalhe) {
  const prefixo = agendamento.status === "pendente" ? "[Pendente] " : "";
  return {
    summary: `${prefixo}${agendamento.servicoNome} — ${agendamento.clienteNome}`,
    description: agendamento.observacoes ?? undefined,
    start: { dateTime: agendamento.dataHoraInicio, timeZone: FUSO_HORARIO },
    end: { dateTime: agendamento.dataHoraFim, timeZone: FUSO_HORARIO },
    extendedProperties: { private: { agendamentoId: agendamento.id } },
  };
}

async function salvarEventoId(agendamentoId: string, eventoId: string | null): Promise<void> {
  await pool.query("UPDATE agendamentos SET google_evento_id = $1 WHERE id = $2", [eventoId, agendamentoId]);
}

// Deixa o evento do Google Agenda igual ao agendamento: cria, atualiza ou
// remove (cancelados não aparecem na agenda).
export async function sincronizarAgendamentoGoogle(agendamentoId: string): Promise<void> {
  const accessToken = await obterAccessToken();
  if (!accessToken) return;

  const [agendamento, vinculo] = await Promise.all([
    obterAgendamentoPorId(agendamentoId),
    pool.query<{ google_evento_id: string | null }>("SELECT google_evento_id FROM agendamentos WHERE id = $1", [
      agendamentoId,
    ]),
  ]);
  if (!agendamento) return;

  const eventoId = vinculo.rows[0]?.google_evento_id ?? null;
  const headers = { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" };

  if (agendamento.status === "cancelado") {
    if (!eventoId) return;
    const resposta = await fetch(`${URL_EVENTOS}/${encodeURIComponent(eventoId)}`, { method: "DELETE", headers });
    if (!resposta.ok && resposta.status !== 404 && resposta.status !== 410) {
      throw new Error(`Falha ao remover evento do Google Agenda (${resposta.status}).`);
    }
    await salvarEventoId(agendamentoId, null);
    return;
  }

  const corpo = JSON.stringify(montarEvento(agendamento));

  if (eventoId) {
    const resposta = await fetch(`${URL_EVENTOS}/${encodeURIComponent(eventoId)}`, {
      method: "PATCH",
      headers,
      body: corpo,
    });
    if (resposta.ok) return;
    // Evento apagado manualmente na agenda: recria abaixo.
    if (resposta.status !== 404 && resposta.status !== 410) {
      throw new Error(`Falha ao atualizar evento do Google Agenda (${resposta.status}).`);
    }
  }

  const resposta = await fetch(URL_EVENTOS, { method: "POST", headers, body: corpo });
  if (!resposta.ok) {
    throw new Error(`Falha ao criar evento no Google Agenda (${resposta.status}).`);
  }
  const evento = (await resposta.json()) as { id: string };
  await salvarEventoId(agendamentoId, evento.id);
}

// Envia para o Google Agenda os agendamentos futuros que ainda não têm evento
// (usado logo após conectar a conta).
export async function sincronizarAgendamentosFuturosGoogle(): Promise<void> {
  const result = await pool.query<{ id: string }>(
    `SELECT id FROM agendamentos
     WHERE status IN ('pendente', 'confirmado') AND data_hora_fim > now() AND google_evento_id IS NULL
     ORDER BY data_hora_inicio`,
  );
  for (const { id } of result.rows) {
    await sincronizarAgendamentoGoogle(id);
  }
}

function registrarErro(error: unknown) {
  if (error instanceof IntegracaoRevogadaError) {
    console.warn(error.message);
    return;
  }
  console.error("Erro ao sincronizar com o Google Agenda:", error);
}

// Roda depois da resposta: a sincronização nunca atrasa nem quebra o agendamento.
export function agendarSincronizacaoGoogle(agendamentoId: string): void {
  after(() => sincronizarAgendamentoGoogle(agendamentoId).catch(registrarErro));
}

export function agendarSincronizacaoFuturosGoogle(): void {
  after(() => sincronizarAgendamentosFuturosGoogle().catch(registrarErro));
}
