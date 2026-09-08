"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Lock } from "lucide-react";
import { useState, type FormEvent } from "react";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { toast } from "@/lib/toast";

export function RedefinirSenhaForm({ token }: { token: string }) {
  const router = useRouter();
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [erros, setErros] = useState({ senha: false, confirmacao: false });

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const senha = String(formData.get("password") ?? "");
    const confirmacao = String(formData.get("confirmPassword") ?? "");
    const novosErros = {
      senha: senha.length < 8,
      confirmacao: !confirmacao || senha !== confirmacao,
    };
    setErros(novosErros);

    if (novosErros.senha) {
      toast.danger("A senha precisa ter pelo menos 8 caracteres.");
      return;
    }
    if (novosErros.confirmacao) {
      toast.danger("As senhas não coincidem.");
      return;
    }

    setEnviando(true);
    try {
      const response = await fetch("/api/auth/redefinir-senha", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, novaSenha: senha }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        toast.danger(data.error ?? "Não foi possível redefinir a senha.");
        return;
      }
      toast.success("Senha redefinida com sucesso!");
      router.push("/login");
    } catch {
      toast.danger("Erro de conexão. Tente novamente.");
    } finally {
      setEnviando(false);
    }
  }

  if (!token) {
    return (
      <AuthLayout
        subtitle="Este link de redefinição é inválido."
        footer={
          <Link href="/esqueci-senha" className="text-center text-sm font-bold text-brand hover:opacity-90">
            Solicitar um novo link
          </Link>
        }
      >
        <div className="rounded-3xl bg-cream-dark p-6 text-sm leading-6 text-ink">
          Não encontramos o token de recuperação. Solicite um novo e-mail para continuar.
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      subtitle="Crie uma nova senha para acessar sua conta."
      footer={
        <Link href="/login" className="text-center text-sm font-bold text-brand hover:opacity-90">
          Voltar para o login
        </Link>
      }
    >
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
        <TextField
          id="password"
          name="password"
          type={mostrarSenha ? "text" : "password"}
          label="Nova senha"
          placeholder="••••••••"
          autoComplete="new-password"
          required
          icon={<Lock size={18} />}
          error={erros.senha}
          errorMessage={erros.senha ? "Use pelo menos 8 caracteres." : undefined}
          onChange={() => setErros((atual) => ({ ...atual, senha: false }))}
          rightSlot={
            <button
              type="button"
              onClick={() => setMostrarSenha((atual) => !atual)}
              aria-label={mostrarSenha ? "Ocultar senha" : "Mostrar senha"}
              className="flex items-center justify-center text-ink-muted"
            >
              {mostrarSenha ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          }
        />
        <TextField
          id="confirm-password"
          name="confirmPassword"
          type={mostrarSenha ? "text" : "password"}
          label="Confirme a nova senha"
          placeholder="••••••••"
          autoComplete="new-password"
          required
          icon={<Lock size={18} />}
          error={erros.confirmacao}
          errorMessage={erros.confirmacao ? "As senhas não coincidem." : undefined}
          onChange={() => setErros((atual) => ({ ...atual, confirmacao: false }))}
        />
        <Button type="submit" className="mt-2" disabled={enviando}>
          {enviando ? "Salvando..." : "Redefinir senha"}
        </Button>
      </form>
    </AuthLayout>
  );
}
