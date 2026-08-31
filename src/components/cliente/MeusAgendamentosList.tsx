"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { useMutacaoApi } from "@/hooks/useMutacaoApi";
import { rotuloAgrupamentoData } from "@/utils/data";
import { ESTILO_BADGE_STATUS, STATUS_LABEL } from "@/utils/statusAgendamento";
import type { AgendamentoDetalhe } from "@/types/agendamento";

type MeusAgendamentosListProps = {
  agendamentos: AgendamentoDetalhe[];
};

function formatarFaixaHorario(inicio: string, fim: string): string {
  const opcoes: Intl.DateTimeFormatOptions = {
    timeZone: "America/Sao_Paulo",
    hour: "2-digit",
    minute: "2-digit",
  };
  const horaInicio = new Date(inicio).toLocaleTimeString("pt-BR", opcoes);
  const horaFim = new Date(fim).toLocaleTimeString("pt-BR", opcoes);
  return `${horaInicio} - ${horaFim}`;
}

export function MeusAgendamentosList({ agendamentos }: MeusAgendamentosListProps) {
  const router = useRouter();
  const [paraCancelar, setParaCancelar] = useState<AgendamentoDetalhe | null>(null);
  const { enviando: cancelando, executar } = useMutacaoApi();

  async function confirmarCancelamento() {
    if (!paraCancelar) return;
    await executar(
      () =>
        fetch(`/api/agendamentos/${paraCancelar.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "cancelado" }),
        }),
      {
        mensagemSucesso: "Agendamento cancelado.",
        mensagemErroPadrao: "Não foi possível cancelar o agendamento.",
        aoSucesso: () => {
          setParaCancelar(null);
          router.refresh();
        },
      },
    );
  }

  if (agendamentos.length === 0) {
    return <p className="text-ink-muted">Você não tem sessões marcadas no momento.</p>;
  }

  const grupos = new Map<string, AgendamentoDetalhe[]>();
  for (const agendamento of agendamentos) {
    const dataISO = agendamento.dataHoraInicio.slice(0, 10);
    const lista = grupos.get(dataISO) ?? [];
    lista.push(agendamento);
    grupos.set(dataISO, lista);
  }

  return (
    <div className="flex flex-col gap-6">
      {[...grupos.entries()].map(([dataISO, lista]) => (
        <div key={dataISO} className="flex flex-col gap-3">
          <h3 className="px-2 text-lg font-semibold text-ink-muted">{rotuloAgrupamentoData(dataISO)}</h3>
          {lista.map((agendamento) => {
            const estilo = ESTILO_BADGE_STATUS[agendamento.status];
            return (
              <div
                key={agendamento.id}
                className="relative flex flex-col gap-4 overflow-hidden rounded-3xl bg-white p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8"
              >
                <div
                  className={`absolute inset-y-0 left-0 w-2 ${estilo.bg}`}
                  aria-hidden="true"
                />
                <div className="pl-2">
                  <h4 className="text-lg font-bold text-ink">{agendamento.servicoNome}</h4>
                  <span className={`mt-1 inline-block rounded-full px-3 py-1 text-xs font-semibold ${estilo.bg} ${estilo.text}`}>
                    {STATUS_LABEL[agendamento.status]}
                  </span>
                </div>
                <div className="flex items-center gap-4 pl-2 sm:pl-0">
                  <div className="text-right">
                    <p className="font-semibold text-ink">
                      {formatarFaixaHorario(agendamento.dataHoraInicio, agendamento.dataHoraFim)}
                    </p>
                    <p className="text-sm text-ink-muted">Duração: {agendamento.duracaoMinutos} min</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setParaCancelar(agendamento)}
                    className="shrink-0 rounded-full border border-input-border px-4 py-1.5 text-sm font-medium text-ink hover:bg-cream-dark"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ))}

      <ConfirmModal
        open={paraCancelar !== null}
        title="Cancelar agendamento"
        message={
          paraCancelar
            ? `Tem certeza que deseja cancelar "${paraCancelar.servicoNome}"? Essa ação não pode ser desfeita.`
            : ""
        }
        confirmLabel="Cancelar agendamento"
        confirmingLabel="Cancelando..."
        confirming={cancelando}
        onConfirm={confirmarCancelamento}
        onCancel={() => setParaCancelar(null)}
      />
    </div>
  );
}
