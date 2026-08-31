"use client";

import { Check, ChevronDown } from "lucide-react";
import { Popover } from "@/components/ui/Popover";

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
  const selecionado = options.find((opcao) => opcao.value === value);

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={id} className="text-sm text-ink">
          {label}
        </label>
      )}
      <Popover
        className="w-full"
        panelClassName="max-h-64 w-full overflow-y-auto p-2"
        trigger={({ aberto, alternar }) => (
          <button
            type="button"
            id={id}
            disabled={disabled}
            onClick={alternar}
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
        )}
      >
        {({ fechar }) =>
          options.map((opcao) => (
            <button
              key={opcao.value}
              type="button"
              onClick={() => {
                onChange(opcao.value);
                fechar();
              }}
              className={`flex w-full items-center justify-between rounded-2xl px-3 py-2 text-left text-sm ${
                opcao.value === value ? "bg-brand text-white" : "text-ink hover:bg-input"
              }`}
            >
              {opcao.label}
              {opcao.value === value && <Check size={16} />}
            </button>
          ))
        }
      </Popover>
    </div>
  );
}
