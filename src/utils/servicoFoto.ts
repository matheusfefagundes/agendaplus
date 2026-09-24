import type { Servico } from "@/types/servico";

// A URL leva a data de atualização do serviço como versão — trocar a foto
// muda `atualizadoEm` e gera uma URL nova, sem precisar invalidar cache manualmente.
export function urlFotoServico(servico: Pick<Servico, "id" | "temFoto" | "atualizadoEm">): string | null {
  if (!servico.temFoto) return null;
  return `/api/servicos/${servico.id}/foto?v=${encodeURIComponent(servico.atualizadoEm)}`;
}
