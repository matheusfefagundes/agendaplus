"use client";

import Link from "next/link";
import { useRef, useState, type MouseEvent as ReactMouseEvent } from "react";
import { ChevronDown, Clock } from "lucide-react";
import { formatarMoeda } from "@/utils/formatters";
import type { Servico } from "@/types/servico";

type SugestoesCarrosselProps = {
  servicos: Servico[];
};

export function SugestoesCarrossel({ servicos }: SugestoesCarrosselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const arrastando = useRef(false);
  const moveu = useRef(false);
  const inicioX = useRef(0);
  const scrollInicial = useRef(0);
  const [expandidoId, setExpandidoId] = useState<string | null>(null);

  function aoPressionar(event: ReactMouseEvent) {
    const el = scrollRef.current;
    if (!el) return;
    arrastando.current = true;
    moveu.current = false;
    inicioX.current = event.pageX;
    scrollInicial.current = el.scrollLeft;
  }

  function aoSoltar() {
    arrastando.current = false;
  }

  function aoMover(event: ReactMouseEvent) {
    const el = scrollRef.current;
    if (!el || !arrastando.current) return;
    const delta = event.pageX - inicioX.current;
    if (Math.abs(delta) > 4) moveu.current = true;
    el.scrollLeft = scrollInicial.current - delta;
  }

  function aoClicarDetalhes(event: ReactMouseEvent, servicoId: string) {
    if (moveu.current) {
      event.preventDefault();
      return;
    }
    setExpandidoId((atual) => (atual === servicoId ? null : servicoId));
  }

  return (
    <div
      ref={scrollRef}
      onMouseDown={aoPressionar}
      onMouseLeave={aoSoltar}
      onMouseUp={aoSoltar}
      onMouseMove={aoMover}
      className="flex cursor-grab items-start gap-6 overflow-x-auto pb-2 select-none active:cursor-grabbing [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      {servicos.map((servico) => {
        const expandido = expandidoId === servico.id;
        return (
          <div
            key={servico.id}
            className="flex w-72 shrink-0 flex-col gap-2 rounded-3xl border border-input-border bg-white p-6"
          >
            <div className="flex items-center gap-2 text-sm text-ink-muted">
              <Clock size={14} />
              {servico.duracaoMinutos} min
            </div>
            <h3 className="text-xl font-medium text-ink">{servico.nome}</h3>
            <span className="text-sm font-semibold text-ink">{formatarMoeda(servico.valor)}</span>

            {expandido && (
              <div className="mt-1 flex flex-col gap-2 border-t border-input-border pt-3 text-sm text-ink-muted">
                <p>{servico.descricao || "Nenhuma descrição cadastrada para este serviço."}</p>
                <p>Duração: {servico.duracaoMinutos} min</p>
                <p>Valor: {formatarMoeda(servico.valor)}</p>
              </div>
            )}

            <div className="mt-2 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={(event) => aoClicarDetalhes(event, servico.id)}
                className="flex items-center gap-1 text-sm font-medium text-confirmado"
              >
                Detalhes do serviço
                <ChevronDown size={14} className={`transition-transform ${expandido ? "rotate-180" : ""}`} />
              </button>
              <Link href="/cliente/novo-agendamento" className="text-sm font-semibold text-brand">
                Agendar
              </Link>
            </div>
          </div>
        );
      })}
    </div>
  );
}
