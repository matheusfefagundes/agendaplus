"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Textarea";
import { DatePicker } from "@/components/ui/DatePicker";
import { Select } from "@/components/ui/Select";
import { useMutacaoApi } from "@/hooks/useMutacaoApi";
import { hojeEmSaoPauloISO } from "@/utils/data";
import type { Servico } from "@/types/servico";

type AgendarModalProps = {
  open: boolean;
  onClose: () => void;
  clienteId: string;
  clienteNome: string;
  servicos: Servico[];
};

export function AgendarModal({ open, onClose, clienteId, clienteNome, servicos }: AgendarModalProps) {
  const router = useRouter();
  const [servicoId, setServicoId] = useState("");
  const [data, setData] = useState("");
  const [horario, setHorario] = useState("");
  const [horariosDisponiveis, setHorariosDisponiveis] = useState<string[]>([]);
  const { enviando: buscando, executar: executarBusca } = useMutacaoApi();
  const { enviando: salvando, executar: executarCriar } = useMutacaoApi();

  async function buscarHorarios(novoServicoId: string, novaData: string) {
    setHorario("");
    setHorariosDisponiveis([]);
    if (!novoServicoId || !novaData) return;

    await executarBusca(
      () => fetch(`/api/agendamentos?data=${novaData}&servicoId=${novoServicoId}`),
      {
        mensagemErroPadrao: "Não foi possível buscar horários.",
        aoSucesso: (resposta) => {
          const { horarios } = resposta as { horarios: string[] };
          setHorariosDisponiveis(horarios);
        },
      },
    );
  }

  function fechar() {
    setServicoId("");
    setData("");
    setHorario("");
    setHorariosDisponiveis([]);
    onClose();
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const observacoes = String(formData.get("observacoes") ?? "").trim() || null;

    await executarCriar(
      () =>
        fetch("/api/agendamentos", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ clienteId, servicoId, data, horario, observacoes }),
        }),
      {
        mensagemSucesso: "Agendamento criado.",
        mensagemErroPadrao: "Não foi possível criar o agendamento.",
        aoSucesso: () => {
          fechar();
          router.refresh();
        },
      },
    );
  }

  return (
    <Modal open={open} onClose={fechar} title={`Agendar para ${clienteNome}`} size="lg">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Select
          id="servicoId"
          label="Serviço"
          placeholder="Selecione um serviço"
          value={servicoId}
          onChange={(novoServicoId) => {
            setServicoId(novoServicoId);
            buscarHorarios(novoServicoId, data);
          }}
          options={servicos.map((servico) => ({
            value: servico.id,
            label: `${servico.nome} (${servico.duracaoMinutos} min)`,
          }))}
        />

        <DatePicker
          id="data"
          label="Data"
          min={hojeEmSaoPauloISO()}
          value={data}
          onChange={(novaData) => {
            setData(novaData);
            buscarHorarios(servicoId, novaData);
          }}
        />

        <div className="flex flex-col gap-1.5">
          <span className="text-sm text-ink">Horário</span>
          {buscando ? (
            <p className="text-sm text-ink-muted">Buscando horários...</p>
          ) : !servicoId || !data ? (
            <p className="text-sm text-ink-muted">Selecione o serviço e a data.</p>
          ) : horariosDisponiveis.length === 0 ? (
            <p className="text-sm text-ink-muted">Nenhum horário disponível nesse dia.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {horariosDisponiveis.map((h) => (
                <button
                  key={h}
                  type="button"
                  onClick={() => setHorario(h)}
                  className={`rounded-full border px-4 py-2 text-sm font-medium ${
                    horario === h
                      ? "border-brand bg-brand text-white"
                      : "border-input-border text-ink hover:bg-input"
                  }`}
                >
                  {h}
                </button>
              ))}
            </div>
          )}
        </div>

        <Textarea id="observacoes" name="observacoes" label="Observações (opcional)" rows={3} />

        <Button
          type="submit"
          size="sm"
          disabled={!servicoId || !data || !horario || salvando}
          className="mt-1 sm:w-auto"
        >
          {salvando ? "Agendando..." : "Confirmar agendamento"}
        </Button>
      </form>
    </Modal>
  );
}
