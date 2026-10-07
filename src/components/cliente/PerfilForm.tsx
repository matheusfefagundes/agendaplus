"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Eye, EyeOff } from "lucide-react";
import { TextField } from "@/components/ui/TextField";
import { Button } from "@/components/ui/Button";
import { toast } from "@/lib/toast";
import { useMutacaoApi } from "@/hooks/useMutacaoApi";
import { mascararTelefone, somenteDigitos } from "@/utils/telefone";

type PerfilFormProps = {
  nome: string;
  email: string;
  telefone: string;
};

type CampoPerfil = "nome" | "email" | "telefone";
type CampoSenha = "senhaAtual" | "novaSenha" | "confirmarSenha";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function PerfilForm({ nome, email, telefone }: PerfilFormProps) {
  const router = useRouter();
  const [telefoneValor, setTelefoneValor] = useState(telefone ? mascararTelefone(telefone) : "");
  const [perfilErrors, setPerfilErrors] = useState<Partial<Record<CampoPerfil, boolean>>>({});
  const [telefoneIncompleto, setTelefoneIncompleto] = useState(false);
  const [senhaErrors, setSenhaErrors] = useState<Partial<Record<CampoSenha, boolean>>>({});
  const [senhaCurta, setSenhaCurta] = useState(false);
  const [senhaMismatch, setSenhaMismatch] = useState(false);
  const [mostrarSenhaAtual, setMostrarSenhaAtual] = useState(false);
  const [mostrarNovaSenha, setMostrarNovaSenha] = useState(false);
  const [mostrarConfirmarSenha, setMostrarConfirmarSenha] = useState(false);
  const { enviando: enviandoPerfil, executar: executarPerfil } = useMutacaoApi();
  const { enviando: enviandoSenha, executar: executarSenha } = useMutacaoApi();

  function limparErroPerfil(campo: CampoPerfil) {
    setPerfilErrors((prev) => {
      if (!prev[campo]) return prev;
      const next = { ...prev };
      delete next[campo];
      return next;
    });
  }

  function limparErroSenha(campo: CampoSenha) {
    setSenhaErrors((prev) => {
      if (!prev[campo]) return prev;
      const next = { ...prev };
      delete next[campo];
      return next;
    });
  }

  async function handlePerfilSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const nome = String(formData.get("nome") ?? "").trim();
    const email = String(formData.get("email") ?? "").trim();
    const digitosTelefone = somenteDigitos(telefoneValor);

    const nextErrors: Partial<Record<CampoPerfil, boolean>> = {};
    if (nome.length < 2) nextErrors.nome = true;
    if (!EMAIL_REGEX.test(email)) nextErrors.email = true;

    const telefoneEstaIncompleto = digitosTelefone.length > 0 && digitosTelefone.length < 10;
    if (telefoneEstaIncompleto) nextErrors.telefone = true;

    setPerfilErrors(nextErrors);
    setTelefoneIncompleto(telefoneEstaIncompleto);

    if (Object.keys(nextErrors).length > 0) {
      toast.danger("Preencha os campos corretamente.");
      return;
    }

    await executarPerfil(
      () =>
        fetch("/api/cliente/perfil", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ nome, email, telefone: telefoneValor || null }),
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
    const senhaAtual = String(formData.get("senhaAtual") ?? "");
    const novaSenha = String(formData.get("novaSenha") ?? "");
    const confirmarSenha = String(formData.get("confirmarSenha") ?? "");

    const nextErrors: Partial<Record<CampoSenha, boolean>> = {};
    if (senhaAtual.trim() === "") nextErrors.senhaAtual = true;

    const eSenhaCurta = novaSenha.length < 8;
    if (eSenhaCurta) nextErrors.novaSenha = true;

    const naoCoincide = !eSenhaCurta && novaSenha !== confirmarSenha;
    if (naoCoincide) nextErrors.confirmarSenha = true;

    setSenhaErrors(nextErrors);
    setSenhaCurta(eSenhaCurta);
    setSenhaMismatch(naoCoincide);

    if (Object.keys(nextErrors).length > 0) {
      toast.danger(
        eSenhaCurta
          ? "A nova senha precisa ter pelo menos 8 caracteres."
          : naoCoincide
            ? "As senhas não coincidem."
            : "Preencha os campos corretamente.",
      );
      return;
    }

    await executarSenha(
      () =>
        fetch("/api/cliente/perfil/senha", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ senhaAtual, novaSenha }),
        }),
      {
        mensagemSucesso: "Senha alterada com sucesso.",
        mensagemErroPadrao: "Não foi possível alterar a senha.",
        aoSucesso: () => {
          form.reset();
          setSenhaCurta(false);
          setSenhaMismatch(false);
        },
      },
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <form
        onSubmit={handlePerfilSubmit}
        noValidate
        className="flex flex-col gap-4 rounded-3xl bg-cream-dark p-6"
      >
        <h2 className="text-lg font-bold text-ink">Perfil</h2>
        <TextField
          id="nome"
          name="nome"
          label="Nome"
          required
          defaultValue={nome}
          error={perfilErrors.nome}
          errorMessage={perfilErrors.nome ? "Informe seu nome completo." : undefined}
          onChange={() => limparErroPerfil("nome")}
        />
        <TextField
          id="email"
          name="email"
          type="email"
          label="E-mail"
          required
          defaultValue={email}
          error={perfilErrors.email}
          errorMessage={perfilErrors.email ? "Informe um e-mail válido." : undefined}
          onChange={() => limparErroPerfil("email")}
        />
        <TextField
          id="telefone"
          name="telefone"
          label="Telefone"
          placeholder="(XX) XXXXX-XXXX"
          inputMode="numeric"
          value={telefoneValor}
          error={perfilErrors.telefone}
          errorMessage={telefoneIncompleto ? "Informe um telefone válido com DDD." : undefined}
          onChange={(event) => {
            setTelefoneValor(mascararTelefone(event.target.value));
            limparErroPerfil("telefone");
            setTelefoneIncompleto(false);
          }}
          tooltip="Usado pelo profissional para entrar em contato com você caso seja necessário."
        />
        <Button type="submit" size="sm" disabled={enviandoPerfil} className="mt-1 sm:w-auto">
          {enviandoPerfil ? "Salvando..." : "Salvar perfil"}
        </Button>
      </form>

      <form
        onSubmit={handleSenhaSubmit}
        noValidate
        className="flex flex-col gap-4 rounded-3xl bg-cream-dark p-6"
      >
        <h2 className="text-lg font-bold text-ink">Alterar senha</h2>
        <TextField
          id="senhaAtual"
          name="senhaAtual"
          type={mostrarSenhaAtual ? "text" : "password"}
          label="Senha atual"
          required
          error={senhaErrors.senhaAtual}
          errorMessage={senhaErrors.senhaAtual ? "Informe sua senha atual." : undefined}
          onChange={() => limparErroSenha("senhaAtual")}
          rightSlot={
            <button
              type="button"
              onClick={() => setMostrarSenhaAtual((prev) => !prev)}
              aria-label={mostrarSenhaAtual ? "Ocultar senha" : "Mostrar senha"}
              className="flex items-center justify-center text-ink-muted"
            >
              {mostrarSenhaAtual ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          }
        />
        <TextField
          id="novaSenha"
          name="novaSenha"
          type={mostrarNovaSenha ? "text" : "password"}
          label="Nova senha"
          required
          error={senhaErrors.novaSenha}
          errorMessage={senhaCurta ? "A nova senha precisa ter pelo menos 8 caracteres." : undefined}
          onChange={() => {
            limparErroSenha("novaSenha");
            setSenhaCurta(false);
            if (senhaMismatch) {
              setSenhaMismatch(false);
              limparErroSenha("confirmarSenha");
            }
          }}
          rightSlot={
            <button
              type="button"
              onClick={() => setMostrarNovaSenha((prev) => !prev)}
              aria-label={mostrarNovaSenha ? "Ocultar senha" : "Mostrar senha"}
              className="flex items-center justify-center text-ink-muted"
            >
              {mostrarNovaSenha ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          }
        />
        <TextField
          id="confirmarSenha"
          name="confirmarSenha"
          type={mostrarConfirmarSenha ? "text" : "password"}
          label="Confirme a nova senha"
          required
          error={senhaErrors.confirmarSenha}
          errorMessage={senhaMismatch ? "As senhas não coincidem." : undefined}
          onChange={() => {
            limparErroSenha("confirmarSenha");
            setSenhaMismatch(false);
          }}
          rightSlot={
            <button
              type="button"
              onClick={() => setMostrarConfirmarSenha((prev) => !prev)}
              aria-label={mostrarConfirmarSenha ? "Ocultar senha" : "Mostrar senha"}
              className="flex items-center justify-center text-ink-muted"
            >
              {mostrarConfirmarSenha ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          }
        />
        <Button type="submit" size="sm" disabled={enviandoSenha} className="mt-2 sm:w-auto">
          {enviandoSenha ? "Salvando..." : "Alterar senha"}
        </Button>
      </form>
    </div>
  );
}
