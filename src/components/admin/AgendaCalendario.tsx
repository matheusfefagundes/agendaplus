"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight, Clock } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { useMutacaoApi } from "@/hooks/useMutacaoApi";
import { adicionarDias, dataLocalBrasil, minutosDeHoraTexto, minutosDoDiaBrasil } from "@/utils/data";
import { formatarHorario } from "@/utils/formatters";
import type { AgendamentoDetalhe, StatusAgendamento } from "@/types/agendamento";
import type { Horario } from "@/types/horario";

const DIAS_ABREV = ["Seg", "Ter", "Qua", "Qui", "Sex"];
const MESES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];
const ALTURA_POR_MINUTO = 2.2;

type AgendaCalendarioProps = {
  domingo: string;
  hoje: string;
  agendamentos: AgendamentoDetalhe[];
  horarios: Horario[];
};

function formatarHoraLabel(minutos: number): string {
  const h = String(Math.floor(minutos / 60)).padStart(2, "0");
  const m = String(minutos % 60).padStart(2, "0");
  return `${h}:${m}`;
}

const ESTILO_STATUS: Record<
  StatusAgendamento,
  { bg: string; border: string; text: string; badge: string; badgeBg: string }
> = {
  pendente: {
    bg: "bg-warning-bg",
    border: "border-warning/30",
    text: "text-ink",
    badge: "text-warning",
    badgeBg: "bg-warning-bg",
  },
  confirmado: {
    bg: "bg-confirmado-bg",
    border: "border-confirmado/30",
    text: "text-confirmado-text",
    badge: "text-confirmado-text",
    badgeBg: "bg-confirmado-bg",
  },
  cancelado: {
    bg: "bg-cancelado-tom-bg",
    border: "border-cancelado-tom-border",
    text: "text-cancelado-tom-text",
    badge: "text-cancelado-tom-text",
    badgeBg: "bg-cancelado-tom-bg",
  },
  concluido: {
    bg: "bg-input",
    border: "border-input-border",
    text: "text-ink-muted",
    badge: "text-ink-muted",
    badgeBg: "bg-input",
  },
};

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

export function AgendaCalendario({ domingo, hoje, agendamentos, horarios }: AgendaCalendarioProps) {
  const router = useRouter();
  const [selecionado, setSelecionado] = useState<AgendamentoDetalhe | null>(null);
  const [visualizacao, setVisualizacao] = useState<"semana" | "dia">("semana");
  const { enviando, executar } = useMutacaoApi();

  const dias = useMemo(() => [1, 2, 3, 4, 5].map((offset) => adicionarDias(domingo, offset)), [domingo]);

  const [domingoAnterior, setDomingoAnterior] = useState(domingo);
  const [diaFocoIndex, setDiaFocoIndex] = useState(() => {
    const indice = dias.indexOf(hoje);
    return indice >= 0 ? indice : 0;
  });

  // Sempre que a semana visível mudar (navegação prev/next/hoje), refoca o
  // dia — ajuste de state durante o render, não em efeito.
  if (domingo !== domingoAnterior) {
    setDomingoAnterior(domingo);
    const indice = dias.indexOf(hoje);
    setDiaFocoIndex(indice >= 0 ? indice : 0);
  }

  const diasVisiveis = visualizacao === "dia" ? [dias[diaFocoIndex]] : dias;
  const abrevVisiveis = visualizacao === "dia" ? [DIAS_ABREV[diaFocoIndex]] : DIAS_ABREV;

  const [ano, mes] = domingo.split("-").map(Number);
  const legendaMes = `${MESES[mes - 1]} ${ano}`;

  const horariosAtivos = horarios.filter((h) => h.ativo);
  const minInicioMin = horariosAtivos.length
    ? Math.min(...horariosAtivos.map((h) => minutosDeHoraTexto(h.horaInicio)))
    : 7 * 60;
  const maxFimMin = horariosAtivos.length
    ? Math.max(...horariosAtivos.map((h) => minutosDeHoraTexto(h.horaFim)))
    : 20 * 60;

  const marcasHora: number[] = [];
  for (let h = Math.ceil(minInicioMin / 60); h <= Math.floor(maxFimMin / 60); h++) {
    marcasHora.push(h * 60);
  }

  const alturaGrade = (maxFimMin - minInicioMin) * ALTURA_POR_MINUTO;

  const agendamentosPorDia = useMemo(() => {
    const mapa = new Map<string, AgendamentoDetalhe[]>();
    for (const dia of dias) mapa.set(dia, []);
    for (const agendamento of agendamentos) {
      const dataDoAgendamento = dataLocalBrasil(agendamento.dataHoraInicio);
      mapa.get(dataDoAgendamento)?.push(agendamento);
    }
    return mapa;
  }, [agendamentos, dias]);

  function irParaSemana(deslocamentoDias: number) {
    const novoDomingo = adicionarDias(domingo, deslocamentoDias);
    router.push(`/admin/agenda?inicio=${novoDomingo}`);
  }

  function irParaHoje() {
    router.push("/admin/agenda");
  }

  function irAnterior() {
    if (visualizacao === "semana") {
      irParaSemana(-7);
      return;
    }
    if (diaFocoIndex === 0) {
      irParaSemana(-7);
      return;
    }
    setDiaFocoIndex((indice) => indice - 1);
  }

  function irProximo() {
    if (visualizacao === "semana") {
      irParaSemana(7);
      return;
    }
    if (diaFocoIndex === dias.length - 1) {
      irParaSemana(7);
      return;
    }
    setDiaFocoIndex((indice) => indice + 1);
  }

  async function mudarStatus(id: string, status: StatusAgendamento) {
    await executar(
      () =>
        fetch(`/api/agendamentos/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status }),
        }),
      {
        mensagemSucesso: "Agendamento atualizado.",
        mensagemErroPadrao: "Não foi possível atualizar o agendamento.",
        aoSucesso: () => {
          setSelecionado(null);
          router.refresh();
        },
      },
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">Sua Agenda</h1>
          <div className="flex items-center gap-2 text-ink-muted">
            <CalendarDays size={16} />
            <span>{legendaMes}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 rounded-full border border-input-border bg-input p-1">
            <button
              type="button"
              onClick={() => setVisualizacao("semana")}
              className={`rounded-full px-5 py-2 text-sm font-medium transition-colors ${
                visualizacao === "semana"
                  ? "bg-white text-confirmado shadow-[0px_1px_1px_rgba(0,0,0,0.05)]"
                  : "text-ink-muted"
              }`}
            >
              Semana
            </button>
            <button
              type="button"
              onClick={() => setVisualizacao("dia")}
              className={`rounded-full px-5 py-2 text-sm font-medium transition-colors ${
                visualizacao === "dia"
                  ? "bg-white text-confirmado shadow-[0px_1px_1px_rgba(0,0,0,0.05)]"
                  : "text-ink-muted"
              }`}
            >
              Dia
            </button>
          </div>
          <button
            type="button"
            onClick={irAnterior}
            aria-label={visualizacao === "semana" ? "Semana anterior" : "Dia anterior"}
            className="flex size-10 items-center justify-center rounded-full border border-input-border bg-cream-dark text-ink hover:bg-input"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            type="button"
            onClick={irParaHoje}
            className="rounded-full border border-input-border bg-cream-dark px-4 py-2 text-sm font-medium text-ink hover:bg-input"
          >
            Hoje
          </button>
          <button
            type="button"
            onClick={irProximo}
            aria-label={visualizacao === "semana" ? "Próxima semana" : "Próximo dia"}
            className="flex size-10 items-center justify-center rounded-full border border-input-border bg-cream-dark text-ink hover:bg-input"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <div className="min-w-[720px]">
          <div
            className={
              visualizacao === "dia"
                ? "grid grid-cols-[56px_1fr] gap-3 pb-3"
                : "grid grid-cols-[56px_repeat(5,1fr)] gap-3 pb-3"
            }
          >
            <div />
            {diasVisiveis.map((dia, i) => {
              const ativo = dia === hoje;
              return (
                <div
                  key={dia}
                  className={`flex flex-col items-center rounded-2xl py-2 ${
                    ativo ? "bg-white shadow-[0px_8px_20px_rgba(26,28,25,0.06)]" : ""
                  }`}
                >
                  <span className="text-sm font-medium text-ink-muted">{abrevVisiveis[i]}</span>
                  <span
                    className={`mt-1 text-xl font-semibold ${ativo ? "text-confirmado" : "text-ink"}`}
                  >
                    {Number(dia.split("-")[2])}
                  </span>
                </div>
              );
            })}
          </div>

          <div
            className={
              visualizacao === "dia"
                ? "grid grid-cols-[56px_1fr] gap-3"
                : "grid grid-cols-[56px_repeat(5,1fr)] gap-3"
            }
            style={{ height: alturaGrade }}
          >
            <div className="relative">
              {marcasHora.map((minutos) => (
                <span
                  key={minutos}
                  className="absolute right-2 -translate-y-1/2 text-sm text-ink-muted"
                  style={{ top: (minutos - minInicioMin) * ALTURA_POR_MINUTO }}
                >
                  {formatarHoraLabel(minutos)}
                </span>
              ))}
            </div>

            {diasVisiveis.map((dia) => (
              <div key={dia} className="relative rounded-3xl bg-cream-dark/40">
                {(agendamentosPorDia.get(dia) ?? []).map((agendamento) => {
                  const inicioMin = minutosDoDiaBrasil(agendamento.dataHoraInicio);
                  const top = (inicioMin - minInicioMin) * ALTURA_POR_MINUTO;
                  const altura = Math.max(agendamento.duracaoMinutos * ALTURA_POR_MINUTO, 48);
                  const estilo = ESTILO_STATUS[agendamento.status];
                  const cancelado = agendamento.status === "cancelado";

                  return (
                    <button
                      key={agendamento.id}
                      type="button"
                      onClick={() => setSelecionado(agendamento)}
                      className={`absolute left-1 right-1 flex flex-col gap-1 overflow-hidden rounded-2xl border p-3 text-left shadow-[0px_1px_1px_rgba(0,0,0,0.05)] ${estilo.bg} ${estilo.border}`}
                      style={{ top, height: altura }}
                    >
                      <span
                        className={`w-fit rounded-md px-2 py-0.5 text-[11px] font-bold tracking-wide uppercase ${estilo.badgeBg} ${estilo.badge}`}
                      >
                        {agendamento.status}
                      </span>
                      <span
                        className={`text-sm leading-tight font-bold ${estilo.text} ${cancelado ? "line-through" : ""}`}
                      >
                        {agendamento.servicoNome}
                      </span>
                      <span className={`truncate text-xs ${estilo.text}`}>{agendamento.clienteNome}</span>
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      <Modal
        open={selecionado !== null}
        onClose={() => setSelecionado(null)}
        title={selecionado?.servicoNome ?? "Agendamento"}
      >
        {selecionado && (
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2 text-ink-muted">
              <Clock size={16} />
              <span>{formatarHorario(selecionado.dataHoraInicio)}</span>
            </div>
            <p className="text-ink">
              <span className="text-ink-muted">Cliente: </span>
              <span className="font-medium">{selecionado.clienteNome}</span>
            </p>
            <span
              className={`w-fit rounded-full px-3 py-1 text-xs font-semibold uppercase ${ESTILO_STATUS[selecionado.status].badgeBg} ${ESTILO_STATUS[selecionado.status].badge}`}
            >
              {selecionado.status}
            </span>
            {selecionado.observacoes && (
              <p className="rounded-2xl bg-cream-dark p-3 text-sm text-ink-muted">
                {selecionado.observacoes}
              </p>
            )}

            {(PROXIMO_STATUS[selecionado.status] ?? []).length > 0 && (
              <div className="flex flex-col gap-2 border-t border-input-border pt-4 sm:flex-row">
                {PROXIMO_STATUS[selecionado.status]?.map(({ label, status }) => (
                  <Button
                    key={status}
                    type="button"
                    size="sm"
                    variant={status === "cancelado" ? "danger" : "primary"}
                    disabled={enviando}
                    onClick={() => mudarStatus(selecionado.id, status)}
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
    </div>
  );
}
