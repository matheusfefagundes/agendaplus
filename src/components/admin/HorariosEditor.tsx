"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { Select } from "@/components/ui/Select";
import { useMutacaoApi } from "@/hooks/useMutacaoApi";
import { formatarHoraCurta } from "@/utils/formatters";
import type { Horario } from "@/types/horario";

const DIAS_SEMANA = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

type HorariosEditorProps = {
  horarios: Horario[];
};

export function HorariosEditor({ horarios }: HorariosEditorProps) {
  const router = useRouter();
  const [diaSemana, setDiaSemana] = useState("");
  const [horarioEditando, setHorarioEditando] = useState<Horario | null>(null);
  const [horarioParaExcluir, setHorarioParaExcluir] = useState<Horario | null>(null);
  const { enviando, executar: executarCriar } = useMutacaoApi();
  const { enviando: excluindo, executar: executarRemover } = useMutacaoApi();
  const { executar: executarAlternar } = useMutacaoApi();
  const { enviando: salvandoEdicao, executar: executarEditar } = useMutacaoApi();

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);

    const payload = {
      diaSemana: Number(diaSemana),
      horaInicio: String(formData.get("horaInicio")),
      horaFim: String(formData.get("horaFim")),
      intervaloMinutos: Number(formData.get("intervaloMinutos") || 0),
    };

    await executarCriar(
      () =>
        fetch("/api/horarios", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }),
      {
        mensagemSucesso: "Horário adicionado.",
        mensagemErroPadrao: "Não foi possível salvar o horário.",
        aoSucesso: () => {
          form.reset();
          setDiaSemana("");
          router.refresh();
        },
      },
    );
  }

  async function handleEditarSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!horarioEditando) return;
    const formData = new FormData(event.currentTarget);

    const payload = {
      horaInicio: String(formData.get("horaInicio")),
      horaFim: String(formData.get("horaFim")),
      intervaloMinutos: Number(formData.get("intervaloMinutos") || 0),
    };

    await executarEditar(
      () =>
        fetch(`/api/horarios/${horarioEditando.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }),
      {
        mensagemSucesso: "Horário atualizado.",
        mensagemErroPadrao: "Não foi possível salvar o horário.",
        aoSucesso: () => {
          setHorarioEditando(null);
          router.refresh();
        },
      },
    );
  }

  async function confirmarRemocao() {
    if (!horarioParaExcluir) return;
    await executarRemover(() => fetch(`/api/horarios/${horarioParaExcluir.id}`, { method: "DELETE" }), {
      mensagemSucesso: "Horário removido.",
      mensagemErroPadrao: "Não foi possível remover.",
      aoSucesso: () => {
        setHorarioParaExcluir(null);
        router.refresh();
      },
    });
  }

  async function alternarAtivo(horario: Horario) {
    await executarAlternar(
      () =>
        fetch(`/api/horarios/${horario.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ativo: !horario.ativo }),
        }),
      {
        mensagemErroPadrao: "Não foi possível atualizar.",
        aoSucesso: () => router.refresh(),
      },
    );
  }

  return (
    <div className="flex flex-col gap-4 rounded-3xl bg-cream-dark p-6">
      <h2 className="text-lg font-bold text-ink">Horários de atendimento</h2>

      {horarios.length === 0 ? (
        <p className="text-sm text-ink-muted">Nenhuma janela de atendimento cadastrada ainda.</p>
      ) : (
        <ul className="flex max-h-96 flex-col gap-2 overflow-y-auto pr-1">
          {horarios.map((horario) => (
            <li
              key={horario.id}
              className="flex items-center justify-between gap-2 rounded-2xl bg-cream px-4 py-3 text-sm"
            >
              <div className="min-w-0">
                <p className="font-medium text-ink">{DIAS_SEMANA[horario.diaSemana]}</p>
                <p className="truncate text-ink-muted">
                  {formatarHoraCurta(horario.horaInicio)} – {formatarHoraCurta(horario.horaFim)}
                  {horario.intervaloMinutos > 0 && ` · intervalo ${horario.intervaloMinutos}min`}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <button
                  type="button"
                  onClick={() => alternarAtivo(horario)}
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    horario.ativo ? "bg-success-bg text-success" : "bg-input text-ink-muted"
                  }`}
                >
                  {horario.ativo ? "Ativo" : "Inativo"}
                </button>
                <button
                  type="button"
                  onClick={() => setHorarioEditando(horario)}
                  aria-label="Editar horário"
                  className="p-1 text-ink-muted hover:text-ink"
                >
                  <Pencil size={16} />
                </button>
                <button
                  type="button"
                  onClick={() => setHorarioParaExcluir(horario)}
                  aria-label="Remover horário"
                  className="p-1 text-ink-muted hover:text-danger"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <form
        onSubmit={handleSubmit}
        className="mt-2 flex shrink-0 flex-col gap-3 border-t border-input-border pt-4"
      >
        <Select
          placeholder="Dia da semana"
          value={diaSemana}
          onChange={setDiaSemana}
          options={DIAS_SEMANA.map((dia, index) => ({ value: String(index), label: dia }))}
        />
        <div className="grid grid-cols-2 gap-3">
          <input
            type="time"
            name="horaInicio"
            required
            aria-label="Horário de início"
            className="w-full rounded-3xl border border-input-border bg-input px-4 py-3 text-ink"
          />
          <input
            type="time"
            name="horaFim"
            required
            aria-label="Horário de fim"
            className="w-full rounded-3xl border border-input-border bg-input px-4 py-3 text-ink"
          />
        </div>
        <input
          type="number"
          name="intervaloMinutos"
          min={0}
          placeholder="Intervalo entre sessões (min)"
          className="w-full rounded-3xl border border-input-border bg-input px-4 py-3 text-ink placeholder:text-ink-muted"
        />
        <Button type="submit" size="sm" disabled={!diaSemana || enviando} className="sm:w-auto">
          <Plus size={18} />
          {enviando ? "Adicionando..." : "Adicionar janela"}
        </Button>
      </form>

      <Modal
        open={horarioEditando !== null}
        onClose={() => setHorarioEditando(null)}
        title={horarioEditando ? `Editar ${DIAS_SEMANA[horarioEditando.diaSemana]}` : "Editar horário"}
      >
        {horarioEditando && (
          <form onSubmit={handleEditarSubmit} className="flex flex-col gap-3">
            <div className="grid grid-cols-2 gap-3">
              <input
                type="time"
                name="horaInicio"
                required
                defaultValue={formatarHoraCurta(horarioEditando.horaInicio)}
                aria-label="Horário de início"
                className="w-full rounded-3xl border border-input-border bg-input px-4 py-3 text-ink"
              />
              <input
                type="time"
                name="horaFim"
                required
                defaultValue={formatarHoraCurta(horarioEditando.horaFim)}
                aria-label="Horário de fim"
                className="w-full rounded-3xl border border-input-border bg-input px-4 py-3 text-ink"
              />
            </div>
            <input
              type="number"
              name="intervaloMinutos"
              min={0}
              defaultValue={horarioEditando.intervaloMinutos}
              placeholder="Intervalo entre sessões (min)"
              className="w-full rounded-3xl border border-input-border bg-input px-4 py-3 text-ink placeholder:text-ink-muted"
            />
            <Button type="submit" size="sm" disabled={salvandoEdicao} className="mt-1 sm:w-auto">
              {salvandoEdicao ? "Salvando..." : "Salvar"}
            </Button>
          </form>
        )}
      </Modal>

      <ConfirmModal
        open={horarioParaExcluir !== null}
        title="Remover horário"
        message={
          horarioParaExcluir
            ? `Remover a janela de ${DIAS_SEMANA[horarioParaExcluir.diaSemana]} (${formatarHoraCurta(
                horarioParaExcluir.horaInicio,
              )} – ${formatarHoraCurta(horarioParaExcluir.horaFim)})? Essa ação não pode ser desfeita.`
            : ""
        }
        confirmLabel="Remover"
        confirming={excluindo}
        onConfirm={confirmarRemocao}
        onCancel={() => setHorarioParaExcluir(null)}
      />
    </div>
  );
}
