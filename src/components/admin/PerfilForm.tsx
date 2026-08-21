"use client";

import { useRouter } from "next/navigation";
import { type FormEvent } from "react";
import { TextField } from "@/components/ui/TextField";
import { Button } from "@/components/ui/Button";
import { toast } from "@/lib/toast";
import { useMutacaoApi } from "@/hooks/useMutacaoApi";

type PerfilFormProps = {
  nome: string;
  email: string;
};

export function PerfilForm({ nome, email }: PerfilFormProps) {
  const router = useRouter();
  const { enviando: enviandoPerfil, executar: executarPerfil } = useMutacaoApi();
  const { enviando: enviandoSenha, executar: executarSenha } = useMutacaoApi();

  async function handlePerfilSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    await executarPerfil(
      () =>
        fetch("/api/perfil", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            nome: formData.get("nome"),
            email: formData.get("email"),
          }),
        }),
      {
        mensagemSucesso: "Perfil atualizado.",
        mensagemErroPadrao: "Não foi possível salvar.",
        aoSucesso: () => router.refresh(),
      },
    );
  }

  async function handleSenhaSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const novaSenha = String(formData.get("novaSenha") ?? "");
    const confirmarSenha = String(formData.get("confirmarSenha") ?? "");

    if (novaSenha !== confirmarSenha) {
      toast.danger("As senhas não coincidem.");
      return;
    }

    await executarSenha(
      () =>
        fetch("/api/perfil/senha", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            senhaAtual: formData.get("senhaAtual"),
            novaSenha,
          }),
        }),
      {
        mensagemSucesso: "Senha alterada com sucesso.",
        mensagemErroPadrao: "Não foi possível alterar a senha.",
        aoSucesso: () => form.reset(),
      },
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <form
        onSubmit={handlePerfilSubmit}
        className="flex flex-col gap-4 rounded-3xl bg-cream-dark p-6"
      >
        <h2 className="text-lg font-bold text-ink">Perfil</h2>
        <TextField id="nome" name="nome" label="Nome" required defaultValue={nome} />
        <TextField id="email" name="email" type="email" label="E-mail" required defaultValue={email} />
        <Button type="submit" size="sm" disabled={enviandoPerfil} className="mt-1 sm:w-auto">
          {enviandoPerfil ? "Salvando..." : "Salvar perfil"}
        </Button>
      </form>

      <form
        onSubmit={handleSenhaSubmit}
        className="flex flex-col gap-4 rounded-3xl bg-cream-dark p-6"
      >
        <h2 className="text-lg font-bold text-ink">Alterar senha</h2>
        <TextField id="senhaAtual" name="senhaAtual" type="password" label="Senha atual" required />
        <TextField id="novaSenha" name="novaSenha" type="password" label="Nova senha" required />
        <TextField
          id="confirmarSenha"
          name="confirmarSenha"
          type="password"
          label="Confirme a nova senha"
          required
        />
        <Button type="submit" size="sm" disabled={enviandoSenha} className="mt-2 sm:w-auto">
          {enviandoSenha ? "Salvando..." : "Alterar senha"}
        </Button>
      </form>
    </div>
  );
}
