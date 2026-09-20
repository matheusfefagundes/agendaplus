"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { useMutacaoApi } from "@/hooks/useMutacaoApi";
import { formatarMoeda } from "@/utils/formatters";
import { rotuloPacote } from "@/utils/pacote";
import type { Pacote } from "@/types/pacote";

type AtribuirPacoteModalProps = {
  open: boolean;
  onClose: () => void;
  clienteId: string;
  clienteNome: string;
  pacotes: Pacote[];
};

export function AtribuirPacoteModal({
  open,
  onClose,
  clienteId,
  clienteNome,
  pacotes,
}: AtribuirPacoteModalProps) {
  const router = useRouter();
  const [pacoteId, setPacoteId] = useState("");
  const { enviando, executar } = useMutacaoApi();

  const pacoteSelecionado = pacotes.find((pacote) => pacote.id === pacoteId) ?? null;

  function fechar() {
    setPacoteId("");
    onClose();
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    await executar(
      () =>
        fetch(`/api/clientes/${clienteId}/pacotes`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ pacoteId }),
        }),
      {
        mensagemSucesso: "Pacote atribuído.",
        mensagemErroPadrao: "Não foi possível atribuir o pacote.",
        aoSucesso: () => {
          fechar();
          router.refresh();
        },
      },
    );
  }

  return (
    <Modal open={open} onClose={fechar} title={`Atribuir pacote a ${clienteNome}`}>
      {pacotes.length === 0 ? (
        <p className="text-ink-muted">
          Não há pacotes ativos. Cadastre um em Pacotes antes de atribuir a um cliente.
        </p>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Select
            label="Pacote"
            placeholder="Selecione um pacote"
            value={pacoteId}
            onChange={setPacoteId}
            options={pacotes.map((pacote) => ({ value: pacote.id, label: rotuloPacote(pacote) }))}
          />

          {pacoteSelecionado && (
            <dl className="grid grid-cols-2 gap-3 rounded-2xl bg-cream-dark p-4 text-sm">
              <div>
                <dt className="text-ink-muted">Valor</dt>
                <dd className="font-semibold text-ink">{formatarMoeda(pacoteSelecionado.valor)}</dd>
              </div>
              <div>
                <dt className="text-ink-muted">Validade</dt>
                <dd className="font-semibold text-ink">{pacoteSelecionado.validadeDias} dias</dd>
              </div>
            </dl>
          )}

          <p className="text-sm text-ink-muted">
            O pagamento é combinado fora do sistema. A validade começa a contar a partir de hoje.
          </p>

          <Button type="submit" size="sm" disabled={!pacoteId || enviando} className="mt-1 sm:w-auto">
            {enviando ? "Atribuindo..." : "Atribuir pacote"}
          </Button>
        </form>
      )}
    </Modal>
  );
}
