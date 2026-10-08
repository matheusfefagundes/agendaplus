import { dataLocalBrasil } from "@/utils/data";
import type { AgendamentoDetalhe, StatusAgendamento } from "@/types/agendamento";

// A agenda do admin não mostra cancelados.
export type StatusAgenda = Exclude<StatusAgendamento, "cancelado">;
export type FiltroAgenda = "todos" | StatusAgenda;

export const STATUS_AGENDA: StatusAgenda[] = ["pendente", "confirmado", "concluido"];

export const ROTULO_STATUS: Record<StatusAgendamento, string> = {
  pendente: "Pendente",
  confirmado: "Confirmado",
  concluido: "Concluído",
  cancelado: "Cancelado",
};

export const ROTULO_STATUS_PLURAL: Record<StatusAgenda, string> = {
  pendente: "Pendentes",
  confirmado: "Confirmados",
  concluido: "Concluídos",
};

export function agruparPorDia(agendamentos: AgendamentoDetalhe[]): Map<string, AgendamentoDetalhe[]> {
  const mapa = new Map<string, AgendamentoDetalhe[]>();
  for (const agendamento of agendamentos) {
    const dia = dataLocalBrasil(agendamento.dataHoraInicio);
    const lista = mapa.get(dia);
    if (lista) lista.push(agendamento);
    else mapa.set(dia, [agendamento]);
  }
  return mapa;
}
