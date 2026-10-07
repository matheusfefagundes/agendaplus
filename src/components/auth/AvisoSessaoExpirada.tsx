"use client";

import { useEffect } from "react";
import { toast } from "@/lib/toast";
import {
  MENSAGEM_SESSAO_EXPIRADA,
  PARAM_SESSAO_EXPIRADA,
  VALOR_SESSAO_EXPIRADA,
} from "@/utils/sessao";

// Mostra o toast uma vez e tira o parâmetro da URL, para o aviso não voltar ao
// recarregar a página.
export function AvisoSessaoExpirada() {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get(PARAM_SESSAO_EXPIRADA) !== VALOR_SESSAO_EXPIRADA) return;

    window.history.replaceState(null, "", window.location.pathname);
    window.setTimeout(() => toast.danger(MENSAGEM_SESSAO_EXPIRADA), 100);
  }, []);

  return null;
}
