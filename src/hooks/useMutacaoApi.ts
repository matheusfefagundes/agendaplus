"use client";

import { useState } from "react";
import { toast } from "@/lib/toast";
import { ROTA_LOGIN_SESSAO_EXPIRADA } from "@/utils/sessao";

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

      // 401 vindo da API significa que o token venceu com a aba aberta: leva ao
      // login, onde o aviso de sessão expirada é exibido.
      if (response.status === 401) {
        window.location.assign(ROTA_LOGIN_SESSAO_EXPIRADA);
        return false;
      }

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
