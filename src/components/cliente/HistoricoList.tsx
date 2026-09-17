"use client";

import { useState } from "react";
import { Select } from "@/components/ui/Select";
import { useMutacaoApi } from "@/hooks/useMutacaoApi";
import { rotuloAgrupamentoData } from "@/utils/data";
import { ESTILO_BADGE_STATUS, STATUS_LABEL } from "@/utils/statusAgendamento";
import type { AgendamentoDetalhe } from "@/types/agendamento";
import type { Servico } from "@/types/servico";

const MESES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

function opcoesPeriodo(): { value: string; label: string }[] {
  const opcoes = [{ value: "", label: "Todos os períodos" }];
  const agora = new Date();
  for (let i = 0; i < 12; i++) {
    const data = new Date(Date.UTC(agora.getUTCFullYear(), agora.getUTCMonth() - i, 1));
    const valor = `${data.getUTCFullYear()}-${String(data.getUTCMonth() + 1).padStart(2, "0")}`;
    opcoes.push({ value: valor, label: `${MESES[data.getUTCMonth()]} ${data.getUTCFullYear()}` });
  }
  return opcoes;
}

function formatarFaixaHorario(inicio: string, fim: string): string {
  const opcoes: Intl.DateTimeFormatOptions = {
    timeZone: "America/Sao_Paulo",
    hour: "2-digit",
    minute: "2-digit",
  };
  return `${new Date(inicio).toLocaleTimeString("pt-BR", opcoes)} - ${new Date(fim).toLocaleTimeString("pt-BR", opcoes)}`;
}

type HistoricoListProps = {
  agendamentosIniciais: AgendamentoDetalhe[];
  temMaisInicial: boolean;
  servicos: Servico[];
};

export function HistoricoList({ agendamentosIniciais, temMaisInicial, servicos }: HistoricoListProps) {
  const [servicoIdFiltro, setServicoIdFiltro] = useState("");
  const [mesFiltro, setMesFiltro] = useState("");
  const [agendamentos, setAgendamentos] = useState(agendamentosIniciais);
  const [temMais, setTemMais] = useState(temMaisInicial);
  const { enviando: filtrando, executar: executarFiltro } = useMutacaoApi();
  const { enviando: carregandoMais, executar: executarCarregarMais } = useMutacaoApi();

  function construirUrl(offset: number, mes: string, servicoId: string) {
    const params = new URLSearchParams({ offset: String(offset) });
    if (servicoId) params.set("servicoId", servicoId);
    if (mes) params.set("mes", mes);
    return `/api/agendamentos/historico?${params.toString()}`;
  }

  async function aplicarFiltro(mes: string, servicoId: string) {
    await executarFiltro(() => fetch(construirUrl(0, mes, servicoId)), {
      mensagemErroPadrao: "Não foi possível carregar o histórico.",
      aoSucesso: (resposta) => {
        const { agendamentos: novos, temMais: novoTemMais } = resposta as {
          agendamentos: AgendamentoDetalhe[];
          temMais: boolean;
        };
        setAgendamentos(novos);
        setTemMais(novoTemMais);
      },
    });
  }

  function handleMesChange(valor: string) {
    setMesFiltro(valor);
    void aplicarFiltro(valor, servicoIdFiltro);
  }

  function handleServicoChange(valor: string) {
    setServicoIdFiltro(valor);
    void aplicarFiltro(mesFiltro, valor);
  }

  async function carregarMais() {
    await executarCarregarMais(() => fetch(construirUrl(agendamentos.length, mesFiltro, servicoIdFiltro)), {
      mensagemErroPadrao: "Não foi possível carregar mais atendimentos.",
      aoSucesso: (resposta) => {
        const { agendamentos: novos, temMais: novoTemMais } = resposta as {
          agendamentos: AgendamentoDetalhe[];
          temMais: boolean;
        };
        setAgendamentos((atual) => [...atual, ...novos]);
        setTemMais(novoTemMais);
      },
    });
  }

  const grupos = new Map<string, AgendamentoDetalhe[]>();
  for (const agendamento of agendamentos) {
    const dataISO = agendamento.dataHoraInicio.slice(0, 10);
    const lista = grupos.get(dataISO) ?? [];
    lista.push(agendamento);
    grupos.set(dataISO, lista);
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        <div className="flex flex-col gap-1.5">
          <span className="px-2 text-sm text-ink-muted">Período</span>
          <Select
            value={mesFiltro}
            onChange={handleMesChange}
            options={opcoesPeriodo()}
            disabled={filtrando}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <span className="px-2 text-sm text-ink-muted">Serviço</span>
          <Select
            value={servicoIdFiltro}
            onChange={handleServicoChange}
            options={[
              { value: "", label: "Todos os Serviços" },
              ...servicos.map((s) => ({ value: s.id, label: s.nome })),
            ]}
            disabled={filtrando}
          />
        </div>
      </div>

      {agendamentos.length === 0 ? (
        <p className="text-ink-muted">Nenhum atendimento encontrado para esse filtro.</p>
      ) : (
        <div className="flex flex-col gap-6">
          {[...grupos.entries()].map(([dataISO, lista]) => (
            <div key={dataISO} className="flex flex-col gap-3">
              <h3 className="px-2 text-lg font-semibold text-ink-muted">{rotuloAgrupamentoData(dataISO)}</h3>
              {lista.map((agendamento) => {
                const estilo = ESTILO_BADGE_STATUS[agendamento.status];
                const cancelado = agendamento.status === "cancelado";
                return (
                  <div
                    key={agendamento.id}
                    className="relative flex flex-col gap-4 overflow-hidden rounded-3xl bg-white p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8"
                  >
                    <div className={`absolute inset-y-0 left-0 w-2 ${estilo.bg}`} aria-hidden="true" />
                    <div className="pl-2">
                      <h4 className={`text-lg font-bold text-ink ${cancelado ? "line-through" : ""}`}>
                        {agendamento.servicoNome}
                      </h4>
                    </div>
                    <div className="flex items-center gap-4 pl-2 sm:pl-0">
                      <div className="text-right">
                        <p className={`font-semibold ${cancelado ? "text-ink-muted" : "text-ink"}`}>
                          {formatarFaixaHorario(agendamento.dataHoraInicio, agendamento.dataHoraFim)}
                        </p>
                        <p className="text-sm text-ink-muted">Duração: {agendamento.duracaoMinutos} min</p>
                      </div>
                      <span className={`shrink-0 rounded-full px-4 py-2 text-sm font-bold ${estilo.bg} ${estilo.text}`}>
                        {STATUS_LABEL[agendamento.status]}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      )}

      {temMais && (
        <div className="flex justify-center pt-4">
          <button
            type="button"
            onClick={carregarMais}
            disabled={carregandoMais}
            className="font-bold text-brand hover:underline disabled:opacity-60"
          >
            {carregandoMais ? "Carregando..." : "Carregar atendimentos anteriores"}
          </button>
        </div>
      )}
    </div>
  );
}
