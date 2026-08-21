"use client";

import { useState } from "react";
import { toast } from "@/lib/toast";

type OpcoesMutacao<T> = {
  aoSucesso?: (data: T) => void;
  mensagemSucesso?: string;
  mensagemErroPadrao?: string;
};

// Centraliza o padrão repetido nos formulários do admin: chamar a API,
// mostrar toast de sucesso/erro, e controlar o estado de "enviando".
export function useMutacaoApi() {
  const [enviando, setEnviando] = useState(false);

  async function executar<T = unknown>(
    chamada: () => Promise<Response>,
    opcoes: OpcoesMutacao<T> = {},
  ): Promise<boolean> {
    setEnviando(true);
    try {
      const response = await chamada();
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        toast.danger(data.error ?? opcoes.mensagemErroPadrao ?? "Não foi possível concluir a ação.");
        return false;
      }

      if (opcoes.mensagemSucesso) {
        toast.success(opcoes.mensagemSucesso);
      }
      opcoes.aoSucesso?.(data as T);
      return true;
    } catch {
      toast.danger("Erro de conexão. Tente novamente.");
      return false;
    } finally {
      setEnviando(false);
    }
  }

  return { enviando, executar };
}
