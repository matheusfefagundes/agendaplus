import type { StatusAgendamento } from "@/types/agendamento";

type EstiloStatus = {
  ponto: string;
  chip: string;
  badge: string;
  barra: string;
};

export const ESTILO_STATUS: Record<StatusAgendamento, EstiloStatus> = {
  pendente: {
    ponto: "bg-warning",
    chip: "bg-warning-bg text-ink",
    badge: "bg-warning-bg text-warning",
    barra: "bg-warning",
  },
  confirmado: {
    ponto: "bg-confirmado",
    chip: "bg-confirmado-bg text-confirmado-text",
    badge: "bg-confirmado-bg text-confirmado-text",
    barra: "bg-confirmado",
  },
  concluido: {
    ponto: "bg-ink/40",
    chip: "bg-input text-ink",
    badge: "bg-input text-ink",
    barra: "bg-ink/40",
  },
  cancelado: {
    ponto: "bg-cancelado-tom-text",
    chip: "bg-cancelado-tom-bg text-cancelado-tom-text",
    badge: "bg-cancelado-tom-bg text-cancelado-tom-text",
    barra: "bg-cancelado-tom-text",
  },
};
