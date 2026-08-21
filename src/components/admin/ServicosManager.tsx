"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { Textarea } from "@/components/ui/Textarea";
import { Modal } from "@/components/ui/Modal";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { useMutacaoApi } from "@/hooks/useMutacaoApi";
import { formatarMoeda } from "@/utils/formatters";
import type { Servico } from "@/types/servico";

type ServicosManagerProps = {
  servicos: Servico[];
};

export function ServicosManager({ servicos }: ServicosManagerProps) {
  const router = useRouter();
  const [modalAberto, setModalAberto] = useState(false);
  const [servicoEditando, setServicoEditando] = useState<Servico | null>(null);
  const [servicoParaExcluir, setServicoParaExcluir] = useState<Servico | null>(null);
  const { enviando, executar: executarSalvar } = useMutacaoApi();
  const { executar: executarAlternar } = useMutacaoApi();
  const { enviando: excluindo, executar: executarExcluir } = useMutacaoApi();

  function abrirNovo() {
    setServicoEditando(null);
    setModalAberto(true);
  }

  function abrirEdicao(servico: Servico) {
    setServicoEditando(servico);
    setModalAberto(true);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    const payload = {
      nome: String(formData.get("nome") ?? "").trim(),
      descricao: String(formData.get("descricao") ?? "").trim() || null,
      duracaoMinutos: Number(formData.get("duracaoMinutos")),
      valor: Number(formData.get("valor")),
    };

    const url = servicoEditando ? `/api/servicos/${servicoEditando.id}` : "/api/servicos";
    const method = servicoEditando ? "PATCH" : "POST";

    await executarSalvar(
      () =>
        fetch(url, {
          method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }),
      {
        mensagemSucesso: servicoEditando ? "Serviço atualizado." : "Serviço criado.",
        mensagemErroPadrao: "Não foi possível salvar o serviço.",
        aoSucesso: () => {
          setModalAberto(false);
          router.refresh();
        },
      },
    );
  }

  async function alternarAtivo(servico: Servico) {
    await executarAlternar(
      () =>
        fetch(`/api/servicos/${servico.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ativo: !servico.ativo }),
        }),
      {
        mensagemSucesso: servico.ativo ? "Serviço desativado." : "Serviço ativado.",
        mensagemErroPadrao: "Não foi possível atualizar o serviço.",
        aoSucesso: () => router.refresh(),
      },
    );
  }

  async function confirmarExclusao() {
    if (!servicoParaExcluir) return;
    await executarExcluir(() => fetch(`/api/servicos/${servicoParaExcluir.id}`, { method: "DELETE" }), {
      mensagemSucesso: "Serviço excluído.",
      mensagemErroPadrao: "Não foi possível excluir o serviço.",
      aoSucesso: () => {
        setServicoParaExcluir(null);
        router.refresh();
      },
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">
          Gestão de Serviços
        </h1>
        <Button type="button" size="sm" className="w-full sm:w-auto" onClick={abrirNovo}>
          <Plus size={18} />
          Novo serviço
        </Button>
      </div>

      {servicos.length === 0 ? (
        <p className="text-ink-muted">Nenhum serviço cadastrado ainda.</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {servicos.map((servico) => (
            <div
              key={servico.id}
              className="flex h-full flex-col gap-3 rounded-3xl bg-cream-dark p-6"
            >
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-bold text-ink">{servico.nome}</h3>
                <span
                  className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${
                    servico.ativo ? "bg-success-bg text-success" : "bg-input text-ink-muted"
                  }`}
                >
                  {servico.ativo ? "Ativo" : "Inativo"}
                </span>
              </div>
              {servico.descricao && (
                <p className="text-sm text-ink-muted line-clamp-3">{servico.descricao}</p>
              )}
              <div className="flex items-center justify-between text-sm text-ink-muted">
                <span>{servico.duracaoMinutos} min</span>
                <span className="font-semibold text-ink">{formatarMoeda(servico.valor)}</span>
              </div>
              <div className="mt-auto flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => abrirEdicao(servico)}
                  className="flex flex-1 items-center justify-center gap-2 rounded-full border border-input-border py-2 text-sm font-medium text-ink hover:bg-cream"
                >
                  <Pencil size={16} />
                  Editar
                </button>
                <button
                  type="button"
                  onClick={() => alternarAtivo(servico)}
                  className="flex-1 rounded-full border border-input-border py-2 text-sm font-medium text-ink hover:bg-cream"
                >
                  {servico.ativo ? "Desativar" : "Ativar"}
                </button>
                <button
                  type="button"
                  onClick={() => setServicoParaExcluir(servico)}
                  aria-label={`Excluir ${servico.nome}`}
                  className="flex shrink-0 items-center justify-center rounded-full border border-input-border p-2 text-ink-muted hover:border-danger hover:text-danger"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        open={modalAberto}
        onClose={() => setModalAberto(false)}
        title={servicoEditando ? "Editar serviço" : "Novo serviço"}
      >
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <TextField id="nome" name="nome" label="Nome" required defaultValue={servicoEditando?.nome} />
          <Textarea
            id="descricao"
            name="descricao"
            label="Descrição"
            rows={3}
            defaultValue={servicoEditando?.descricao ?? ""}
          />
          <div className="grid grid-cols-2 gap-4">
            <TextField
              id="duracaoMinutos"
              name="duracaoMinutos"
              type="number"
              min={1}
              label="Duração (min)"
              required
              defaultValue={servicoEditando?.duracaoMinutos}
            />
            <TextField
              id="valor"
              name="valor"
              type="number"
              min={0}
              step="0.01"
              label="Valor (R$)"
              required
              defaultValue={servicoEditando?.valor}
            />
          </div>
          <Button type="submit" disabled={enviando} className="mt-2">
            {enviando ? "Salvando..." : "Salvar"}
          </Button>
        </form>
      </Modal>

      <ConfirmModal
        open={servicoParaExcluir !== null}
        title="Excluir serviço"
        message={
          servicoParaExcluir
            ? `Tem certeza que deseja excluir "${servicoParaExcluir.nome}"? Essa ação não pode ser desfeita.`
            : ""
        }
        confirmLabel="Excluir"
        confirming={excluindo}
        onConfirm={confirmarExclusao}
        onCancel={() => setServicoParaExcluir(null)}
      />
    </div>
  );
}
