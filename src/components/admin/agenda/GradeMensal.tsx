import { formatarHoraBrasil, formatarDiaEMes, mesDaData } from "@/utils/data";
import { ESTILO_STATUS } from "@/components/admin/agenda/estiloStatus";
import type { AgendamentoDetalhe } from "@/types/agendamento";

const DIAS_CABECALHO = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const MAX_PONTOS = 3;
const MAX_CHIPS = 2;

type GradeMensalProps = {
  mes: string;
  dias: string[];
  hoje: string;
  diaSelecionado: string | null;
  agendamentosPorDia: Map<string, AgendamentoDetalhe[]>;
  aoSelecionarDia: (dia: string) => void;
};

export function GradeMensal({
  mes,
  dias,
  hoje,
  diaSelecionado,
  agendamentosPorDia,
  aoSelecionarDia,
}: GradeMensalProps) {
  return (
    <div className="overflow-hidden rounded-2xl border border-input bg-input">
      <div className="grid grid-cols-7 gap-px">
        {DIAS_CABECALHO.map((dia) => (
          <div
            key={dia}
            className="bg-cream-dark py-2.5 text-center text-[11px] font-bold tracking-wide text-ink-muted uppercase sm:text-xs"
          >
            {dia}
          </div>
        ))}

        {dias.map((dia) => {
          const agendamentos = agendamentosPorDia.get(dia) ?? [];
          const foraDoMes = mesDaData(dia) !== mes;
          const ehHoje = dia === hoje;
          const selecionado = dia === diaSelecionado;
          const excedentesChips = agendamentos.length - MAX_CHIPS;

          return (
            <button
              key={dia}
              type="button"
              onClick={() => aoSelecionarDia(dia)}
              aria-pressed={selecionado}
              aria-label={`${formatarDiaEMes(dia)}, ${agendamentos.length} agendamento${agendamentos.length === 1 ? "" : "s"}`}
              className={`flex min-h-16 min-w-0 flex-col items-start gap-1 p-1.5 text-left transition-colors sm:min-h-24 sm:p-2 ${
                selecionado
                  ? "bg-brand/10 ring-2 ring-brand ring-inset"
                  : foraDoMes
                    ? "bg-cream-dark hover:bg-cream"
                    : "bg-white hover:bg-cream"
              }`}
            >
              <span
                className={`flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold sm:size-7 sm:text-sm ${
                  ehHoje ? "bg-brand text-white" : foraDoMes ? "text-ink-muted" : "text-ink"
                }`}
              >
                {Number(dia.split("-")[2])}
              </span>

              {agendamentos.length > 0 && (
                <>
                  <div className="flex flex-wrap items-center gap-0.5 pl-1 sm:hidden">
                    {agendamentos.slice(0, MAX_PONTOS).map((agendamento) => (
                      <span
                        key={agendamento.id}
                        className={`size-1.5 rounded-full ${ESTILO_STATUS[agendamento.status].ponto}`}
                      />
                    ))}
                    {agendamentos.length > MAX_PONTOS && (
                      <span className="text-[10px] leading-none font-bold text-ink-muted">+</span>
                    )}
                  </div>

                  <div className="hidden w-full min-w-0 flex-col gap-1 sm:flex">
                    {agendamentos.slice(0, MAX_CHIPS).map((agendamento) => (
                      <span
                        key={agendamento.id}
                        className={`truncate rounded-md px-1.5 py-0.5 text-[11px] font-medium ${ESTILO_STATUS[agendamento.status].chip}`}
                      >
                        <span className="font-bold">{formatarHoraBrasil(agendamento.dataHoraInicio)}</span>{" "}
                        {agendamento.servicoNome}
                      </span>
                    ))}
                    {excedentesChips > 0 && (
                      <span className="px-1.5 text-[11px] font-semibold text-ink-muted">+{excedentesChips} mais</span>
                    )}
                  </div>
                </>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
