import { Check } from "lucide-react";

type OpcaoSelecao = {
  value: string;
  label: string;
};

type SelecaoMultiplaProps = {
  label?: string;
  ajuda?: string;
  value: string[];
  onChange: (valores: string[]) => void;
  options: OpcaoSelecao[];
};

// Lista de opções em "chips" para marcar uma ou mais.
export function SelecaoMultipla({ label, ajuda, value, onChange, options }: SelecaoMultiplaProps) {
  function alternar(opcao: string) {
    onChange(value.includes(opcao) ? value.filter((v) => v !== opcao) : [...value, opcao]);
  }

  return (
    <fieldset className="flex w-full min-w-0 flex-col gap-1.5">
      {label && <legend className="mb-1.5 text-sm text-ink">{label}</legend>}
      <div className="flex w-full flex-col gap-2">
        {options.map((opcao) => {
          const marcado = value.includes(opcao.value);
          return (
            <button
              key={opcao.value}
              type="button"
              role="checkbox"
              aria-checked={marcado}
              onClick={() => alternar(opcao.value)}
              className={`flex min-h-12 w-full items-center gap-3 rounded-3xl border px-4 py-3 text-left text-sm font-medium transition-colors ${
                marcado
                  ? "border-brand bg-brand/15 text-ink"
                  : "border-input-border bg-input text-ink-muted hover:text-ink"
              }`}
            >
              <span
                aria-hidden="true"
                className={`flex size-5 shrink-0 items-center justify-center rounded-md border transition-colors ${
                  marcado ? "border-brand bg-brand text-white" : "border-ink/30 bg-white"
                }`}
              >
                {marcado && <Check size={14} strokeWidth={3} />}
              </span>
              <span className="min-w-0 flex-1 break-words">{opcao.label}</span>
            </button>
          );
        })}
      </div>
      {ajuda && <p className="text-xs text-ink-muted">{ajuda}</p>}
    </fieldset>
  );
}
