"use client";

import Link from "next/link";
import { ArrowLeft, Mail } from "lucide-react";
import { useState, type FormEvent } from "react";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { toast } from "@/lib/toast";

export default function EsqueciSenhaPage() {
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [email, setEmail] = useState("");
  const [erro, setErro] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!email.trim()) {
      setErro(true);
      toast.danger("Informe seu e-mail.");
      return;
    }

    setEnviando(true);
    try {
      const response = await fetch("/api/auth/esqueci-senha", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        toast.danger(data.error ?? "Não foi possível enviar o e-mail.");
        return;
      }
      setEnviado(true);
    } catch {
      toast.danger("Erro de conexão. Tente novamente.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <AuthLayout
      subtitle={
        enviado
          ? "Confira sua caixa de entrada e também a pasta de spam."
          : "Informe seu e-mail para receber um link de redefinição."
      }
      footer={
        <Link href="/login" className="flex items-center justify-center gap-2 text-sm font-bold text-brand hover:opacity-90">
          <ArrowLeft size={16} />
          Voltar para o login
        </Link>
      }
    >
      {enviado ? (
        <div className="rounded-3xl bg-cream-dark p-6 text-sm leading-6 text-ink">
          Se houver uma conta com o e-mail informado, enviaremos as instruções. O link será válido por 1 hora.
        </div>
      ) : (
        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
          <TextField
            id="email"
            name="email"
            type="email"
            label="E-mail"
            placeholder="seu@email.com"
            autoComplete="email"
            required
            icon={<Mail size={18} />}
            value={email}
            error={erro}
            onChange={(event) => {
              setEmail(event.target.value);
              setErro(false);
            }}
          />
          <Button type="submit" className="mt-2" disabled={enviando}>
            {enviando ? "Enviando..." : "Enviar link de recuperação"}
          </Button>
        </form>
      )}
    </AuthLayout>
  );
}
