"use client";

import Link from "next/link";
import { ArrowRight, Eye, EyeOff, Lock, Mail } from "lucide-react";
import { useState, type FormEvent } from "react";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { toast } from "@/lib/toast";

type FieldName = "email" | "password";

const REQUIRED_FIELDS: FieldName[] = ["email", "password"];

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<FieldName, boolean>>>({});

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const nextErrors: Partial<Record<FieldName, boolean>> = {};

    for (const field of REQUIRED_FIELDS) {
      const value = formData.get(field);
      if (typeof value !== "string" || value.trim() === "") {
        nextErrors[field] = true;
      }
    }

    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      toast.danger("Preencha todos os campos obrigatórios.");
      return;
    }
  }

  function limparErro(field: FieldName) {
    setErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }

  return (
    <AuthLayout
      subtitle={
        <>
          Bem-vindo(a) ao seu momento.
          <br />
          Faça login para acessar sua agenda.
        </>
      }
      footer={
        <p className="flex justify-center gap-1 text-center text-sm text-ink">
          Ainda não tem uma conta?{" "}
          <Link href="/cadastro" className="font-bold text-brand hover:opacity-90">
            Cadastre-se
          </Link>
        </p>
      }
    >
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
          error={errors.email}
          onChange={() => limparErro("email")}
        />

        <TextField
          id="password"
          name="password"
          type={showPassword ? "text" : "password"}
          label="Senha"
          placeholder="••••••••"
          autoComplete="current-password"
          required
          icon={<Lock size={18} />}
          error={errors.password}
          onChange={() => limparErro("password")}
          labelAction={
            <Link
              href="/esqueci-senha"
              className="border-b border-transparent pb-px text-sm font-bold text-brand hover:border-brand"
            >
              Esqueci minha senha
            </Link>
          }
          rightSlot={
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
              className="flex items-center justify-center text-ink-muted"
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          }
        />

        <Button type="submit" className="mt-2">
          Entrar
        </Button>
      </form>
    </AuthLayout>
  );
}
