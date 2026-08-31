import type { StatusAgendamento } from "@/types/agendamento";

export const STATUS_LABEL: Record<StatusAgendamento, string> = {
  pendente: "Pendente",
  confirmado: "Confirmado",
  cancelado: "Cancelado",
  concluido: "Concluído",
};

export const ESTILO_BADGE_STATUS: Record<StatusAgendamento, { bg: string; text: string }> = {
  pendente: { bg: "bg-warning-bg", text: "text-warning" },
  confirmado: { bg: "bg-confirmado-bg", text: "text-confirmado-text" },
  concluido: { bg: "bg-confirmado-bg", text: "text-confirmado-text" },
  cancelado: { bg: "bg-danger-bg", text: "text-danger" },
};
