import { abreviarMes, dataLocalBrasil, DIAS_SEMANA, diaDaSemana, formatarHoraBrasil } from "@/utils/data";
import type { AgendamentoDetalhe } from "@/types/agendamento";

type ProximosCompromissosProps = {
  agendamentos: AgendamentoDetalhe[];
  aoAbrirAgendamento: (agendamento: AgendamentoDetalhe) => void;
};

function descreverQuando(iso: string): string {
  const dia = dataLocalBrasil(iso);
  const diaSemana = DIAS_SEMANA[diaDaSemana(dia)].slice(0, 3).toLowerCase();
  return `${diaSemana}, ${formatarHoraBrasil(iso)}`;
}

export function ProximosCompromissos({ agendamentos, aoAbrirAgendamento }: ProximosCompromissosProps) {
  return (
    <section className="rounded-2xl border border-input bg-white p-5">
      <p className="text-[11px] font-bold tracking-widest text-ink-muted uppercase">A seguir</p>
      <h2 className="mt-1 text-lg font-bold text-ink">Próximos compromissos</h2>

      {agendamentos.length === 0 ? (
        <p className="mt-5 text-sm text-ink-muted">Nenhum compromisso pela frente.</p>
      ) : (
        <ul className="mt-4 flex flex-col gap-1">
          {agendamentos.map((agendamento) => {
            const dia = dataLocalBrasil(agendamento.dataHoraInicio);
            return (
              <li key={agendamento.id}>
                <button
                  type="button"
                  onClick={() => aoAbrirAgendamento(agendamento)}
                  className="flex w-full items-center gap-3 rounded-xl p-2 text-left transition-colors hover:bg-cream"
                >
                  <span className="flex size-12 shrink-0 flex-col items-center justify-center rounded-xl bg-brand/15 text-brand">
                    <span className="text-lg leading-none font-bold">{Number(dia.split("-")[2])}</span>
                    <span className="mt-0.5 text-[10px] font-bold">{abreviarMes(dia)}</span>
                  </span>
                  <span className="flex min-w-0 flex-col">
                    <span className="truncate font-semibold text-ink">{agendamento.servicoNome}</span>
                    <span className="truncate text-sm text-ink-muted">
                      {agendamento.clienteNome} · {descreverQuando(agendamento.dataHoraInicio)}
                    </span>
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
