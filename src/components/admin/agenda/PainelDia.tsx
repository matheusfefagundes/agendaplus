import type { Ref } from "react";
import { X } from "lucide-react";
import { formatarDiaSemanaEData, formatarHoraBrasil } from "@/utils/data";
import { ROTULO_STATUS } from "@/utils/agenda";
import { ESTILO_STATUS } from "@/components/admin/agenda/estiloStatus";
import type { AgendamentoDetalhe } from "@/types/agendamento";

type PainelDiaProps = {
  dia: string;
  hoje: string;
  agendamentos: AgendamentoDetalhe[];
  aoFechar: () => void;
  aoAbrirAgendamento: (agendamento: AgendamentoDetalhe) => void;
  ref?: Ref<HTMLElement>;
};

export function PainelDia({ dia, hoje, agendamentos, aoFechar, aoAbrirAgendamento, ref }: PainelDiaProps) {
  return (
    <section ref={ref} className="scroll-mt-4 rounded-2xl border border-input bg-white p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-bold tracking-widest text-ink-muted uppercase">
            {dia === hoje ? "Hoje" : "Dia selecionado"}
          </p>
          <h2 className="mt-1 text-lg font-bold text-ink">{formatarDiaSemanaEData(dia)}</h2>
        </div>
        <button
          type="button"
          onClick={aoFechar}
          aria-label="Fechar dia"
          className="-mt-1 -mr-1 flex size-9 shrink-0 items-center justify-center rounded-full text-ink hover:bg-cream-dark"
        >
          <X size={18} />
        </button>
      </div>

      {agendamentos.length === 0 ? (
        <p className="mt-5 text-sm text-ink-muted">Nada marcado neste dia.</p>
      ) : (
        <ul className="mt-4 flex flex-col gap-2">
          {agendamentos.map((agendamento) => {
            const estilo = ESTILO_STATUS[agendamento.status];
            return (
              <li key={agendamento.id}>
                <button
                  type="button"
                  onClick={() => aoAbrirAgendamento(agendamento)}
                  className="flex w-full items-stretch gap-3 rounded-xl p-2 text-left transition-colors hover:bg-cream"
                >
                  <span className={`w-1 shrink-0 rounded-full ${estilo.barra}`} />
                  <span className="flex w-12 shrink-0 flex-col text-sm">
                    <span className="font-bold text-ink">{formatarHoraBrasil(agendamento.dataHoraInicio)}</span>
                    <span className="text-ink-muted">{formatarHoraBrasil(agendamento.dataHoraFim)}</span>
                  </span>
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate font-semibold text-ink">{agendamento.servicoNome}</span>
                    <span className="truncate text-sm text-ink-muted">{agendamento.clienteNome}</span>
                  </span>
                  <span
                    className={`h-fit shrink-0 rounded-full px-2 py-0.5 text-[11px] font-bold ${estilo.badge}`}
                  >
                    {ROTULO_STATUS[agendamento.status]}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
