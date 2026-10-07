"use client";

import { useId, useRef, useState, type KeyboardEvent, type ReactNode } from "react";

export type AbaTabs = {
  id: string;
  rotulo: string;
  icone?: ReactNode;
  conteudo: ReactNode;
};

type TabsProps = {
  abas: AbaTabs[];
  abaInicial?: string;
  className?: string;
};

// Todos os painéis ficam montados (só o ativo aparece), para não perder o que
// foi digitado num formulário ao alternar de aba.
export function Tabs({ abas, abaInicial, className = "" }: TabsProps) {
  const base = useId();
  const [abaAtiva, setAbaAtiva] = useState(abaInicial ?? abas[0]?.id);
  const botoes = useRef<(HTMLButtonElement | null)[]>([]);

  function selecionar(indice: number) {
    const aba = abas[indice];
    if (!aba) return;
    setAbaAtiva(aba.id);
    botoes.current[indice]?.focus();
  }

  function aoPressionarTecla(event: KeyboardEvent<HTMLButtonElement>, indice: number) {
    const ultimo = abas.length - 1;
    const destinos: Record<string, number> = {
      ArrowRight: indice === ultimo ? 0 : indice + 1,
      ArrowLeft: indice === 0 ? ultimo : indice - 1,
      Home: 0,
      End: ultimo,
    };
    const destino = destinos[event.key];
    if (destino === undefined) return;
    event.preventDefault();
    selecionar(destino);
  }

  return (
    <div className={className}>
      <div role="tablist" className="flex gap-1 rounded-full bg-input p-1">
        {abas.map((aba, indice) => {
          const ativa = aba.id === abaAtiva;
          return (
            <button
              key={aba.id}
              ref={(elemento) => {
                botoes.current[indice] = elemento;
              }}
              type="button"
              role="tab"
              id={`${base}-aba-${aba.id}`}
              aria-selected={ativa}
              aria-controls={`${base}-painel-${aba.id}`}
              tabIndex={ativa ? 0 : -1}
              onClick={() => setAbaAtiva(aba.id)}
              onKeyDown={(event) => aoPressionarTecla(event, indice)}
              className={`flex flex-1 items-center justify-center gap-2 rounded-full px-3 py-2 text-sm font-semibold transition-colors ${
                ativa ? "bg-brand text-white" : "text-ink-muted hover:text-ink"
              }`}
            >
              {aba.icone}
              {aba.rotulo}
            </button>
          );
        })}
      </div>

      {abas.map((aba) => (
        <div
          key={aba.id}
          role="tabpanel"
          id={`${base}-painel-${aba.id}`}
          aria-labelledby={`${base}-aba-${aba.id}`}
          hidden={aba.id !== abaAtiva}
          className="pt-5"
        >
          {aba.conteudo}
        </div>
      ))}
    </div>
  );
}
