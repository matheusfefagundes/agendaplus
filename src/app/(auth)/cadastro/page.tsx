"use client";

import Link from "next/link";
import { ArrowRight, Eye, EyeOff, Lock, Mail, User } from "lucide-react";
import { useState, type FormEvent } from "react";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { toast } from "@/lib/toast";

type FieldName = "name" | "email" | "password" | "confirmPassword";

const REQUIRED_FIELDS: FieldName[] = ["name", "email", "password", "confirmPassword"];

export default function CadastroPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<FieldName, boolean>>>({});
  const [passwordMismatch, setPasswordMismatch] = useState(false);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const nextErrors: Partial<Record<FieldName, boolean>> = {};
    let campoFaltando = false;

    for (const field of REQUIRED_FIELDS) {
      const value = formData.get(field);
      if (typeof value !== "string" || value.trim() === "") {
        nextErrors[field] = true;
        campoFaltando = true;
      }
    }

    const senhaDiferente =
      !nextErrors.password &&
      !nextErrors.confirmPassword &&
      formData.get("password") !== formData.get("confirmPassword");

    if (senhaDiferente) {
      nextErrors.confirmPassword = true;
    }

    setErrors(nextErrors);
    setPasswordMismatch(senhaDiferente);

    if (campoFaltando) {
      toast.danger("Preencha todos os campos obrigatórios.");
      return;
    }

    if (senhaDiferente) {
      toast.danger("As senhas não coincidem.");
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

  function handlePasswordChange() {
    limparErro("password");
    if (passwordMismatch) {
      setPasswordMismatch(false);
      limparErro("confirmPassword");
    }
  }

  function handleConfirmPasswordChange() {
    limparErro("confirmPassword");
    setPasswordMismatch(false);
  }

  return (
    <AuthLayout
      footer={
        <p className="flex justify-center gap-1 text-center text-sm text-ink">
          Já tem uma conta?{" "}
          <Link href="/login" className="font-bold text-brand hover:opacity-90">
            Faça o login
          </Link>
        </p>
      }
    >
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
        <TextField
          id="name"
          name="name"
          type="text"
          label="Nome"
          placeholder="seu nome"
          autoComplete="name"
          required
          icon={<User size={18} />}
          error={errors.name}
          onChange={() => limparErro("name")}
        />

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
          autoComplete="new-password"
          required
          icon={<Lock size={18} />}
          error={errors.password}
          onChange={handlePasswordChange}
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

        <TextField
          id="confirm-password"
          name="confirmPassword"
          type={showConfirmPassword ? "text" : "password"}
          label="Confirme sua Senha"
          placeholder="••••••••"
          autoComplete="new-password"
          required
          icon={<Lock size={18} />}
          error={errors.confirmPassword}
          errorMessage={passwordMismatch ? "As senhas não coincidem." : undefined}
          onChange={handleConfirmPasswordChange}
          rightSlot={
            <button
              type="button"
              onClick={() => setShowConfirmPassword((prev) => !prev)}
              aria-label={showConfirmPassword ? "Ocultar senha" : "Mostrar senha"}
              className="flex items-center justify-center text-ink-muted"
            >
              {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          }
        />

        <Button type="submit" className="mt-2">
          Cadastrar-se
        </Button>
      </form>
    </AuthLayout>
  );
}
