"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Ban, Ticket } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Tabs, type AbaTabs } from "@/components/ui/Tabs";
import { TextField } from "@/components/ui/TextField";
import { useMutacaoApi } from "@/hooks/useMutacaoApi";
import { formatarDataPacote, rotuloSessoes } from "@/utils/pacote";
import type { PacoteCliente } from "@/types/pacote";

type EditarPacoteModalProps = {
  pacote: PacoteCliente | null;
  onClose: () => void;
  onCancelarPacote: (pacote: PacoteCliente) => void;
};

export function EditarPacoteModal({ pacote, onClose, onCancelarPacote }: EditarPacoteModalProps) {
  return (
    <Modal open={pacote !== null} onClose={onClose} title="Editar pacote">
      {pacote && (
        <EditarPacoteForm
          key={pacote.id}
          pacote={pacote}
          onClose={onClose}
          onCancelarPacote={onCancelarPacote}
        />
      )}
    </Modal>
  );
}

type EditarPacoteFormProps = {
  pacote: PacoteCliente;
  onClose: () => void;
  onCancelarPacote: (pacote: PacoteCliente) => void;
};

function EditarPacoteForm({ pacote, onClose, onCancelarPacote }: EditarPacoteFormProps) {
  const router = useRouter();
  const [total, setTotal] = useState(String(pacote.quantidadeSessoes));
  const { enviando, executar } = useMutacaoApi();

  const minimo = Math.max(1, pacote.sessoesUsadas);
  const novoTotal = Number(total);
  const valido = Number.isInteger(novoTotal) && novoTotal >= minimo && novoTotal <= 1000;
  const restantes = valido ? novoTotal - pacote.sessoesUsadas : null;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!valido) return;

    await executar(
      () =>
        fetch(`/api/clientes/${pacote.clienteId}/pacotes/${pacote.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ quantidadeSessoes: novoTotal }),
        }),
      {
        mensagemSucesso: "Sessões do pacote atualizadas.",
        mensagemErroPadrao: "Não foi possível ajustar o pacote.",
        aoSucesso: () => {
          onClose();
          router.refresh();
        },
      },
    );
  }

  const abas: AbaTabs[] = [
    {
      id: "sessoes",
      rotulo: "Sessões",
      icone: <Ticket size={16} />,
      conteudo: (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <TextField
            id="totalSessoes"
            name="totalSessoes"
            type="number"
            inputMode="numeric"
            min={minimo}
            max={1000}
            step={1}
            label="Total de sessões do pacote"
            value={total}
            onChange={(event) => setTotal(event.target.value)}
            error={total !== "" && !valido}
            errorMessage={
              total !== "" && !valido ? `Informe um número inteiro a partir de ${minimo}.` : undefined
            }
          />

          <p className="rounded-2xl bg-cream-dark px-4 py-3 text-sm text-ink">
            {restantes === null
              ? "Informe o novo total para ver quantas sessões vão restar."
              : `Depois do ajuste, restam ${rotuloSessoes(restantes)}.`}
          </p>

          <Button type="submit" size="sm" disabled={!valido || enviando} className="sm:w-auto">
            {enviando ? "Salvando..." : "Salvar ajuste"}
          </Button>
        </form>
      ),
    },
    {
      id: "cancelar",
      rotulo: "Cancelar",
      icone: <Ban size={16} />,
      conteudo: (
        <div className="flex flex-col gap-4">
          <p className="text-sm text-ink-muted">
            As {rotuloSessoes(pacote.sessoesRestantes)} restantes deixam de poder ser usadas. Agendamentos
            já feitos com este pacote continuam valendo.
          </p>
          <Button
            type="button"
            variant="danger"
            size="sm"
            onClick={() => onCancelarPacote(pacote)}
            className="sm:w-auto"
          >
            Cancelar pacote
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-5">
      <p className="text-sm text-ink-muted">
        {pacote.servicoNome} · {rotuloSessoes(pacote.sessoesUsadas)} já usadas · vence em{" "}
        {formatarDataPacote(pacote.expiraEm)}
      </p>

      <Tabs abas={abas} />
    </div>
  );
}
