import type { Pacote, PacoteCliente, SaldoServicoPacote, SituacaoPacoteCliente } from "@/types/pacote";

export const SITUACAO_PACOTE_LABEL: Record<SituacaoPacoteCliente, string> = {
  ativo: "Ativo",
  esgotado: "Esgotado",
  expirado: "Expirado",
  cancelado: "Cancelado",
};

export const ESTILO_BADGE_SITUACAO_PACOTE: Record<SituacaoPacoteCliente, { bg: string; text: string }> = {
  ativo: { bg: "bg-success-bg", text: "text-success" },
  esgotado: { bg: "bg-input", text: "text-ink-muted" },
  expirado: { bg: "bg-input", text: "text-ink-muted" },
  cancelado: { bg: "bg-input", text: "text-ink-muted" },
};

export function rotuloSessoes(quantidade: number): string {
  return `${quantidade} ${quantidade === 1 ? "sessão" : "sessões"}`;
}

export function rotuloPacote(pacote: Pick<Pacote, "quantidadeSessoes" | "servicoNome">): string {
  return `${rotuloSessoes(pacote.quantidadeSessoes)} · ${pacote.servicoNome}`;
}

export function rotuloRestantes(pacote: Pick<PacoteCliente, "sessoesRestantes" | "quantidadeSessoes">): string {
  return `${pacote.sessoesRestantes} de ${pacote.quantidadeSessoes} restantes`;
}

// Soma as sessões restantes dos pacotes ativos de cada serviço; a validade
// mostrada é a do pacote que vence primeiro (o primeiro a ser consumido).
export function calcularSaldoPorServico(pacotes: PacoteCliente[]): SaldoServicoPacote[] {
  const porServico = new Map<string, SaldoServicoPacote>();
  for (const pacote of pacotes) {
    if (pacote.situacao !== "ativo") continue;
    const atual = porServico.get(pacote.servicoId);
    if (!atual) {
      porServico.set(pacote.servicoId, {
        servicoId: pacote.servicoId,
        sessoesRestantes: pacote.sessoesRestantes,
        expiraEm: pacote.expiraEm,
      });
      continue;
    }
    atual.sessoesRestantes += pacote.sessoesRestantes;
    if (pacote.expiraEm < atual.expiraEm) atual.expiraEm = pacote.expiraEm;
  }
  return [...porServico.values()];
}

export function formatarDataPacote(dataISO: string): string {
  const [ano, mes, dia] = dataISO.split("-");
  return `${dia}/${mes}/${ano}`;
}
