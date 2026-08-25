export type StatusAgendamento = "pendente" | "confirmado" | "cancelado" | "concluido";

export type AgendamentoDetalhe = {
  id: string;
  clienteId: string;
  clienteNome: string;
  servicoId: string;
  servicoNome: string;
  duracaoMinutos: number;
  dataHoraInicio: string;
  dataHoraFim: string;
  status: StatusAgendamento;
  observacoes: string | null;
};
