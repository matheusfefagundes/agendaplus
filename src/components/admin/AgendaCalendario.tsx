"use client";

import { useRouter } from "next/navigation";
import { useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { GradeMensal } from "@/components/admin/agenda/GradeMensal";
import { PainelDia } from "@/components/admin/agenda/PainelDia";
import { ProximosCompromissos } from "@/components/admin/agenda/ProximosCompromissos";
import { DetalheAgendamentoModal } from "@/components/admin/agenda/DetalheAgendamentoModal";
import { ESTILO_STATUS } from "@/components/admin/agenda/estiloStatus";
import { useMutacaoApi } from "@/hooks/useMutacaoApi";
import { adicionarMeses, dataLocalBrasil, diasDaGradeDoMes, formatarMesAno, mesDaData } from "@/utils/data";
import { agruparPorDia, ROTULO_STATUS_PLURAL, STATUS_AGENDA, type FiltroAgenda } from "@/utils/agenda";
import type { AgendamentoDetalhe, StatusAgendamento } from "@/types/agendamento";

type AgendaCalendarioProps = {
  mes: string;
  hoje: string;
  agendamentos: AgendamentoDetalhe[];
  proximos: AgendamentoDetalhe[];
};

function diaInicial(mes: string, hoje: string): string | null {
  return mesDaData(hoje) === mes ? hoje : null;
}

export function AgendaCalendario({ mes, hoje, agendamentos, proximos }: AgendaCalendarioProps) {
  const router = useRouter();
  const painelRef = useRef<HTMLElement>(null);
  const { enviando, executar } = useMutacaoApi();
  const [filtro, setFiltro] = useState<FiltroAgenda>("todos");
  const [aberto, setAberto] = useState<AgendamentoDetalhe | null>(null);
  const [diaSelecionado, setDiaSelecionado] = useState<string | null>(() => diaInicial(mes, hoje));

  // Ao trocar de mês, volta a seleção para hoje (se estiver no mês) — ajuste
  // de state durante o render, não em efeito.
  const [mesAnterior, setMesAnterior] = useState(mes);
  if (mes !== mesAnterior) {
    setMesAnterior(mes);
    setDiaSelecionado(diaInicial(mes, hoje));
  }

  const dias = useMemo(() => diasDaGradeDoMes(mes), [mes]);
  const filtrados = useMemo(
    () => (filtro === "todos" ? agendamentos : agendamentos.filter((a) => a.status === filtro)),
    [agendamentos, filtro],
  );
  const agendamentosPorDia = useMemo(() => agruparPorDia(filtrados), [filtrados]);

  const contagemDoMes = useMemo(() => {
    const contagem: Record<string, number> = {};
    for (const agendamento of agendamentos) {
      if (mesDaData(dataLocalBrasil(agendamento.dataHoraInicio)) !== mes) continue;
      contagem[agendamento.status] = (contagem[agendamento.status] ?? 0) + 1;
    }
    return contagem;
  }, [agendamentos, mes]);

  function irParaMes(novoMes: string) {
    router.push(novoMes === mesDaData(hoje) ? "/admin/agenda" : `/admin/agenda?mes=${novoMes}`);
  }

  function irParaHoje() {
    if (mes === mesDaData(hoje)) {
      setDiaSelecionado(hoje);
      return;
    }
    irParaMes(mesDaData(hoje));
  }

  function selecionarDia(dia: string) {
    setDiaSelecionado(dia);
    // No celular o painel do dia fica abaixo do calendário: rola até ele.
    if (window.matchMedia("(max-width: 1023px)").matches) {
      requestAnimationFrame(() => painelRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
    }
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
        mensagemSucesso: status === "cancelado" ? "Agendamento cancelado." : "Agendamento atualizado.",
        mensagemErroPadrao: "Não foi possível atualizar o agendamento.",
        aoSucesso: () => {
          setAberto(null);
          router.refresh();
        },
      },
    );
  }

  const opcoesFiltro: { valor: FiltroAgenda; rotulo: string }[] = [
    { valor: "todos", rotulo: "Tudo" },
    ...STATUS_AGENDA.map((status) => ({ valor: status, rotulo: ROTULO_STATUS_PLURAL[status] })),
  ];

  return (
    <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
      <div className="flex min-w-0 flex-1 flex-col gap-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-1 sm:gap-2">
            <button
              type="button"
              onClick={() => irParaMes(adicionarMeses(mes, -1))}
              aria-label="Mês anterior"
              className="flex size-10 shrink-0 items-center justify-center rounded-full text-ink hover:bg-cream-dark"
            >
              <ChevronLeft size={20} />
            </button>
            <h1 className="min-w-0 truncate text-center text-lg font-bold text-ink sm:min-w-52 sm:text-2xl">
              {formatarMesAno(mes)}
            </h1>
            <button
              type="button"
              onClick={() => irParaMes(adicionarMeses(mes, 1))}
              aria-label="Próximo mês"
              className="flex size-10 shrink-0 items-center justify-center rounded-full text-ink hover:bg-cream-dark"
            >
              <ChevronRight size={20} />
            </button>
          </div>
          <button
            type="button"
            onClick={irParaHoje}
            className="shrink-0 rounded-full border border-ink/20 px-4 py-2 text-sm font-semibold text-ink hover:bg-cream-dark"
          >
            Hoje
          </button>
        </div>

        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0">
          {opcoesFiltro.map(({ valor, rotulo }) => (
            <button
              key={valor}
              type="button"
              onClick={() => setFiltro(valor)}
              aria-pressed={filtro === valor}
              className={`shrink-0 rounded-full border px-4 py-2 text-sm font-semibold transition-colors ${
                filtro === valor
                  ? "border-ink bg-ink text-white"
                  : "border-ink/20 bg-white text-ink hover:bg-cream-dark"
              }`}
            >
              {rotulo}
            </button>
          ))}
        </div>

        <ul className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-ink-muted">
          {STATUS_AGENDA.map((status) => (
            <li key={status} className="flex items-center gap-1.5">
              <span className={`size-2 rounded-full ${ESTILO_STATUS[status].ponto}`} />
              {ROTULO_STATUS_PLURAL[status]}
              <span className="font-bold text-ink">{contagemDoMes[status] ?? 0}</span>
            </li>
          ))}
        </ul>

        <GradeMensal
          mes={mes}
          dias={dias}
          hoje={hoje}
          diaSelecionado={diaSelecionado}
          agendamentosPorDia={agendamentosPorDia}
          aoSelecionarDia={selecionarDia}
        />
      </div>

      <aside className="flex flex-col gap-4 lg:sticky lg:top-0 lg:w-80 lg:shrink-0 xl:w-96">
        {diaSelecionado && (
          <PainelDia
            ref={painelRef}
            dia={diaSelecionado}
            hoje={hoje}
            agendamentos={agendamentosPorDia.get(diaSelecionado) ?? []}
            aoFechar={() => setDiaSelecionado(null)}
            aoAbrirAgendamento={setAberto}
          />
        )}
        <ProximosCompromissos agendamentos={proximos} aoAbrirAgendamento={setAberto} />
      </aside>

      <DetalheAgendamentoModal
        agendamento={aberto}
        enviando={enviando}
        aoFechar={() => setAberto(null)}
        aoMudarStatus={mudarStatus}
      />
    </div>
  );
}
