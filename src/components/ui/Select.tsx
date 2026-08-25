"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";

export type OpcaoSelect = {
  value: string;
  label: string;
};

type SelectProps = {
  id?: string;
  label?: string;
  placeholder?: string;
  value: string;
  onChange: (valor: string) => void;
  options: OpcaoSelect[];
  disabled?: boolean;
};

export function Select({
  id,
  label,
  placeholder = "Selecione",
  value,
  onChange,
  options,
  disabled,
}: SelectProps) {
  const [aberto, setAberto] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function aoClicarFora(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setAberto(false);
      }
    }
    document.addEventListener("mousedown", aoClicarFora);
    return () => document.removeEventListener("mousedown", aoClicarFora);
  }, []);

  const selecionado = options.find((opcao) => opcao.value === value);

  return (
    <div className="relative flex flex-col gap-1.5" ref={containerRef}>
      {label && (
        <label htmlFor={id} className="text-sm text-ink">
          {label}
        </label>
      )}
      <button
        type="button"
        id={id}
        disabled={disabled}
        onClick={() => setAberto((atual) => !atual)}
        className="flex w-full items-center justify-between rounded-3xl border border-input-border bg-input px-4 py-3 text-left text-ink disabled:opacity-60"
      >
        <span className={`truncate ${selecionado ? "" : "text-ink-muted"}`}>
          {selecionado ? selecionado.label : placeholder}
        </span>
        <ChevronDown
          size={18}
          className={`shrink-0 text-ink-muted transition-transform ${aberto ? "rotate-180" : ""}`}
        />
      </button>

      {aberto && (
        <div className="absolute top-full z-50 mt-2 max-h-64 w-full overflow-y-auto rounded-3xl border border-input-border bg-cream p-2 shadow-lg">
          {options.map((opcao) => (
            <button
              key={opcao.value}
              type="button"
              onClick={() => {
                onChange(opcao.value);
                setAberto(false);
              }}
              className={`flex w-full items-center justify-between rounded-2xl px-3 py-2 text-left text-sm ${
                opcao.value === value ? "bg-brand text-white" : "text-ink hover:bg-input"
              }`}
            >
              {opcao.label}
              {opcao.value === value && <Check size={16} />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
