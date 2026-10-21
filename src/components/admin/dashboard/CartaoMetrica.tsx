import type { LucideIcon } from "lucide-react";

export default function CartaoMetrica({
  icone: Icone,
  label,
  valor,
  descricao,
}: {
  icone: LucideIcon;
  label: string;
  valor: string;
  descricao?: string;
}) {
  return (
    <div className="min-w-0 overflow-hidden rounded-3xl bg-cream-dark p-4 sm:p-5">
      <div className="flex items-center gap-2 text-sm text-ink-muted">
        <Icone size={16} className="shrink-0 text-brand" />
        <span>{label}</span>
      </div>
      <p
        className="mt-2 truncate text-xl font-extrabold tabular-nums text-ink sm:text-2xl"
        title={valor}
      >
        {valor}
      </p>
      {descricao ? (
        <p className="mt-1 truncate text-xs text-ink-muted">{descricao}</p>
      ) : null}
    </div>
  );
}
