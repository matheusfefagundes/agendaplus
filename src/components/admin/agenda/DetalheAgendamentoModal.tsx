import { Clock, User } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { dataLocalBrasil, formatarDiaSemanaEData, formatarHoraBrasil } from "@/utils/data";
import { ROTULO_STATUS } from "@/utils/agenda";
import { ESTILO_STATUS } from "@/components/admin/agenda/estiloStatus";
import type { AgendamentoDetalhe, StatusAgendamento } from "@/types/agendamento";

const PROXIMO_STATUS: Partial<Record<StatusAgendamento, { label: string; status: StatusAgendamento }[]>> = {
  pendente: [
    { label: "Confirmar", status: "confirmado" },
    { label: "Cancelar", status: "cancelado" },
  ],
  confirmado: [
    { label: "Concluir", status: "concluido" },
    { label: "Cancelar", status: "cancelado" },
  ],
};

type DetalheAgendamentoModalProps = {
  agendamento: AgendamentoDetalhe | null;
  enviando: boolean;
  aoFechar: () => void;
  aoMudarStatus: (id: string, status: StatusAgendamento) => void;
};

export function DetalheAgendamentoModal({
  agendamento,
  enviando,
  aoFechar,
  aoMudarStatus,
}: DetalheAgendamentoModalProps) {
  const acoes = agendamento ? (PROXIMO_STATUS[agendamento.status] ?? []) : [];

  return (
    <Modal open={agendamento !== null} onClose={aoFechar} title={agendamento?.servicoNome ?? "Agendamento"}>
      {agendamento && (
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2 text-ink-muted">
            <Clock size={16} className="shrink-0" />
            <span>
              {formatarDiaSemanaEData(dataLocalBrasil(agendamento.dataHoraInicio))} ·{" "}
              {formatarHoraBrasil(agendamento.dataHoraInicio)} – {formatarHoraBrasil(agendamento.dataHoraFim)}
            </span>
          </div>
          <div className="flex items-center gap-2 text-ink">
            <User size={16} className="shrink-0 text-ink-muted" />
            <span className="font-medium">{agendamento.clienteNome}</span>
          </div>
          <span
            className={`w-fit rounded-full px-3 py-1 text-xs font-bold uppercase ${ESTILO_STATUS[agendamento.status].badge}`}
          >
            {ROTULO_STATUS[agendamento.status]}
          </span>
          {agendamento.observacoes && (
            <p className="rounded-2xl bg-cream-dark p-3 text-sm text-ink-muted">{agendamento.observacoes}</p>
          )}

          {acoes.length > 0 && (
            <div className="flex flex-col gap-2 border-t border-input-border pt-4 sm:flex-row">
              {acoes.map(({ label, status }) => (
                <Button
                  key={status}
                  type="button"
                  size="sm"
                  variant={status === "cancelado" ? "danger" : "primary"}
                  disabled={enviando}
                  onClick={() => aoMudarStatus(agendamento.id, status)}
                  className="sm:w-auto"
                >
                  {label}
                </Button>
              ))}
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}
