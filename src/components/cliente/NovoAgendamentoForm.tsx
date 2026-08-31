"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Check, ChevronLeft, ChevronRight, Moon, Sun, Sunset } from "lucide-react";
import { Select } from "@/components/ui/Select";
import { useMutacaoApi } from "@/hooks/useMutacaoApi";
import { formatarDataExtensa, hojeEmSaoPauloISO } from "@/utils/data";
import { formatarMoeda } from "@/utils/formatters";
import type { Servico } from "@/types/servico";

const DIAS_ABREV = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const MESES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

type NovoAgendamentoFormProps = {
  servicos: Servico[];
};

function paraPartes(iso: string): { ano: number; mes: number; dia: number } {
  const [ano, mes, dia] = iso.split("-").map(Number);
  return { ano, mes, dia };
}

function paraISO(ano: number, mes: number, dia: number): string {
  return `${ano}-${String(mes).padStart(2, "0")}-${String(dia).padStart(2, "0")}`;
}

function diasDoMes(ano: number, mes: number): number {
  return new Date(Date.UTC(ano, mes, 0)).getUTCDate();
}

function primeiroDiaSemana(ano: number, mes: number): number {
  return new Date(Date.UTC(ano, mes - 1, 1)).getUTCDay();
}

function agruparPorPeriodo(horarios: string[]) {
  const manha: string[] = [];
  const tarde: string[] = [];
  const noite: string[] = [];
  for (const h of horarios) {
    const hora = Number(h.slice(0, 2));
    if (hora < 12) manha.push(h);
    else if (hora < 18) tarde.push(h);
    else noite.push(h);
  }
  return { manha, tarde, noite };
}

export function NovoAgendamentoForm({ servicos }: NovoAgendamentoFormProps) {
  const router = useRouter();
  const hojeISO = hojeEmSaoPauloISO();
  const [servicoId, setServicoId] = useState(servicos[0]?.id ?? "");
  const [data, setData] = useState("");
  const [horario, setHorario] = useState("");
  const [horariosDisponiveis, setHorariosDisponiveis] = useState<string[]>([]);
  const base = paraPartes(data || hojeISO);
  const [mesVisivel, setMesVisivel] = useState({ ano: base.ano, mes: base.mes });
  const { enviando: buscando, executar: executarBusca } = useMutacaoApi();
  const { enviando: salvando, executar: executarCriar } = useMutacaoApi();

  const servico = servicos.find((s) => s.id === servicoId) ?? null;

  async function buscarHorarios(novoServicoId: string, novaData: string) {
    setHorario("");
    setHorariosDisponiveis([]);
    if (!novoServicoId || !novaData) return;

    await executarBusca(() => fetch(`/api/agendamentos?data=${novaData}&servicoId=${novoServicoId}`), {
      mensagemErroPadrao: "Não foi possível buscar horários.",
      aoSucesso: (resposta) => {
        const { horarios } = resposta as { horarios: string[] };
        setHorariosDisponiveis(horarios);
      },
    });
  }

  function selecionarDia(dia: number) {
    const iso = paraISO(mesVisivel.ano, mesVisivel.mes, dia);
    if (iso < hojeISO) return;
    setData(iso);
    buscarHorarios(servicoId, iso);
  }

  function mudarMes(delta: number) {
    setMesVisivel((atual) => {
      let mes = atual.mes + delta;
      let ano = atual.ano;
      if (mes < 1) {
        mes = 12;
        ano -= 1;
      } else if (mes > 12) {
        mes = 1;
        ano += 1;
      }
      return { ano, mes };
    });
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    await executarCriar(
      () =>
        fetch("/api/agendamentos", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ servicoId, data, horario, observacoes: null }),
        }),
      {
        mensagemSucesso: "Agendamento confirmado!",
        mensagemErroPadrao: "Não foi possível confirmar o agendamento.",
        aoSucesso: () => {
          router.push("/cliente/meus-agendamentos");
          router.refresh();
        },
      },
    );
  }

  const totalDias = diasDoMes(mesVisivel.ano, mesVisivel.mes);
  const offset = primeiroDiaSemana(mesVisivel.ano, mesVisivel.mes);
  const celulas: (number | null)[] = [
    ...Array<null>(offset).fill(null),
    ...Array.from({ length: totalDias }, (_, i) => i + 1),
  ];

  const { manha, tarde, noite } = agruparPorPeriodo(horariosDisponiveis);

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_380px]">
      <div className="flex flex-col gap-8">
        <div className="flex flex-col gap-4">
          <h2 className="text-2xl font-semibold text-ink">Serviço</h2>
          <Select
            value={servicoId}
            onChange={(novoServicoId) => {
              setServicoId(novoServicoId);
              buscarHorarios(novoServicoId, data);
            }}
            options={servicos.map((s) => ({
              value: s.id,
              label: `${s.nome} · ${s.duracaoMinutos} min · ${formatarMoeda(s.valor)}`,
            }))}
            placeholder="Selecione um serviço"
          />
        </div>

        <div className="flex flex-col gap-4">
          <h2 className="text-2xl font-semibold text-ink">Escolha a Data</h2>
          <div className="flex flex-col gap-4 rounded-3xl bg-cream-dark p-6">
            <div className="flex items-center justify-between px-2">
              <span className="text-lg font-bold text-ink">
                {MESES[mesVisivel.mes - 1]} {mesVisivel.ano}
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => mudarMes(-1)}
                  aria-label="Mês anterior"
                  className="rounded-full p-2 text-ink hover:bg-input"
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  type="button"
                  onClick={() => mudarMes(1)}
                  aria-label="Próximo mês"
                  className="rounded-full p-2 text-ink hover:bg-input"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
            <div className="grid grid-cols-7 gap-2 text-center text-sm font-medium text-ink-muted">
              {DIAS_ABREV.map((dia) => (
                <span key={dia}>{dia}</span>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-2">
              {celulas.map((dia, i) => {
                if (dia === null) return <span key={`vazio-${i}`} />;
                const iso = paraISO(mesVisivel.ano, mesVisivel.mes, dia);
                const desabilitado = iso < hojeISO;
                const selecionado = iso === data;
                return (
                  <button
                    key={iso}
                    type="button"
                    disabled={desabilitado}
                    onClick={() => selecionarDia(dia)}
                    className={`aspect-square rounded-2xl text-sm font-medium transition-colors ${
                      selecionado
                        ? "bg-brand font-bold text-white shadow-[0px_10px_15px_-3px_rgba(101,82,138,0.2)]"
                        : desabilitado
                          ? "cursor-not-allowed text-ink-muted/40"
                          : "text-ink hover:bg-input"
                    }`}
                  >
                    {dia}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <h2 className="text-2xl font-semibold text-ink">Horários Disponíveis</h2>
          {!servicoId || !data ? (
            <p className="text-sm text-ink-muted">Selecione o serviço e a data para ver os horários.</p>
          ) : buscando ? (
            <p className="text-sm text-ink-muted">Buscando horários...</p>
          ) : horariosDisponiveis.length === 0 ? (
            <p className="text-sm text-ink-muted">Nenhum horário disponível nesse dia.</p>
          ) : (
            <div className="flex flex-col gap-6">
              {[
                { rotulo: "Manhã", icone: Sun, horarios: manha },
                { rotulo: "Tarde", icone: Sunset, horarios: tarde },
                { rotulo: "Noite", icone: Moon, horarios: noite },
              ]
                .filter((grupo) => grupo.horarios.length > 0)
                .map(({ rotulo, icone: Icone, horarios }) => (
                  <div key={rotulo} className="flex flex-col gap-3">
                    <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-ink-muted">
                      <Icone size={16} />
                      {rotulo}
                    </div>
                    <div className="grid grid-cols-3 gap-3 sm:grid-cols-5">
                      {horarios.map((h) => (
                        <button
                          key={h}
                          type="button"
                          onClick={() => setHorario(h)}
                          className={`rounded-full border px-3 py-3 text-sm font-medium ${
                            horario === h
                              ? "border-brand bg-brand text-white shadow-[0px_10px_15px_-3px_rgba(101,82,138,0.2)]"
                              : "border-input-border text-ink hover:bg-input"
                          }`}
                        >
                          {h}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>

      <aside className="flex flex-col gap-6 lg:sticky lg:top-8 lg:self-start">
        <div className="flex flex-col gap-4 rounded-3xl bg-cream-dark p-8">
          <h3 className="text-xl font-bold text-ink">Resumo do Agendamento</h3>

          {servico ? (
            <div className="flex flex-col gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-ink-muted">Serviço</p>
                <p className="font-semibold text-ink">{servico.nome}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-ink-muted">Data</p>
                  <p className="font-semibold text-ink">{data ? formatarDataExtensa(data) : "—"}</p>
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-ink-muted">Horário</p>
                  <p className="font-semibold text-ink">{horario || "—"}</p>
                </div>
              </div>

              <div className="flex flex-col gap-2 border-t border-input-border pt-4">
                <div className="flex items-center justify-between text-ink-muted">
                  <span>Duração</span>
                  <span>{servico.duracaoMinutos} min</span>
                </div>
                <div className="flex items-center justify-between pt-2">
                  <span className="text-lg font-bold text-ink">Total</span>
                  <span className="text-lg font-bold text-brand">{formatarMoeda(servico.valor)}</span>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-sm text-ink-muted">Selecione um serviço para ver o resumo.</p>
          )}

          <button
            type="submit"
            disabled={!servicoId || !data || !horario || salvando}
            className="mt-2 flex w-full items-center justify-center gap-2 rounded-full bg-brand py-4 text-lg font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            {salvando ? "Confirmando..." : "Confirmar Agendamento"}
            {!salvando && <Check size={20} />}
          </button>

          <p className="px-2 text-center text-xs text-ink-muted">
            Você pode cancelar este agendamento a qualquer momento em &quot;Meus Agendamentos&quot;.
          </p>
        </div>
      </aside>
    </form>
  );
}
