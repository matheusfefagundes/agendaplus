import Link from "next/link";
import { CalendarPlus } from "lucide-react";
import {
  ESTILO_BADGE_SITUACAO_PACOTE,
  formatarDataPacote,
  rotuloRestantes,
  SITUACAO_PACOTE_LABEL,
} from "@/utils/pacote";
import type { PacoteCliente } from "@/types/pacote";

type MeusPacotesListProps = {
  pacotes: PacoteCliente[];
};

export function MeusPacotesList({ pacotes }: MeusPacotesListProps) {
  if (pacotes.length === 0) {
    return (
      <p className="text-ink-muted">
        Você ainda não tem pacotes. Fale com a profissional para adquirir um.
      </p>
    );
  }

  const ordenados = [...pacotes].sort(
    (a, b) => Number(b.situacao === "ativo") - Number(a.situacao === "ativo"),
  );

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {ordenados.map((pacote) => {
        const estilo = ESTILO_BADGE_SITUACAO_PACOTE[pacote.situacao];
        const progresso = Math.min(100, (pacote.sessoesUsadas / pacote.quantidadeSessoes) * 100);
        const inativo = pacote.situacao !== "ativo";

        return (
          <div
            key={pacote.id}
            className={`flex h-full flex-col gap-4 rounded-3xl bg-cream-dark p-6 ${inativo ? "opacity-70" : ""}`}
          >
            <div className="flex items-start justify-between gap-2">
              <h3 className="min-w-0 font-bold text-ink">{pacote.servicoNome}</h3>
              <span
                className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${estilo.bg} ${estilo.text}`}
              >
                {SITUACAO_PACOTE_LABEL[pacote.situacao]}
              </span>
            </div>

            <div className="flex flex-col gap-2">
              <div
                role="progressbar"
                aria-valuemin={0}
                aria-valuemax={pacote.quantidadeSessoes}
                aria-valuenow={pacote.sessoesUsadas}
                aria-label="Sessões usadas do pacote"
                className="h-2 w-full overflow-hidden rounded-full bg-input"
              >
                <div className="h-full rounded-full bg-brand" style={{ width: `${progresso}%` }} />
              </div>
              <p className="text-sm font-semibold text-ink">{rotuloRestantes(pacote)}</p>
              <p className="text-sm text-ink-muted">
                {pacote.situacao === "expirado" ? "Venceu" : "Vence"} em {formatarDataPacote(pacote.expiraEm)}
              </p>
            </div>

            {pacote.situacao === "ativo" && (
              <Link
                href="/cliente/novo-agendamento"
                className="mt-auto flex items-center justify-center gap-2 rounded-full bg-brand px-5 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
              >
                <CalendarPlus size={16} />
                Agendar sessão
              </Link>
            )}
          </div>
        );
      })}
    </div>
  );
}
