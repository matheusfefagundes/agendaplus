"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { Modal } from "@/components/ui/Modal";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { Select } from "@/components/ui/Select";
import { useMutacaoApi } from "@/hooks/useMutacaoApi";
import { formatarMoeda } from "@/utils/formatters";
import { rotuloSessoes } from "@/utils/pacote";
import type { Pacote } from "@/types/pacote";
import type { Servico } from "@/types/servico";

type PacotesManagerProps = {
  pacotes: Pacote[];
  servicos: Servico[];
};

type FiltroStatus = "todos" | "ativo" | "inativo";

const OPCOES_FILTRO_STATUS = [
  { value: "todos", label: "Todos" },
  { value: "ativo", label: "Ativos" },
  { value: "inativo", label: "Inativos" },
];

export function PacotesManager({ pacotes, servicos }: PacotesManagerProps) {
  const router = useRouter();
  const [modalAberto, setModalAberto] = useState(false);
  const [pacoteEditando, setPacoteEditando] = useState<Pacote | null>(null);
  const [servicoId, setServicoId] = useState("");
  const [pacoteParaExcluir, setPacoteParaExcluir] = useState<Pacote | null>(null);
  const [pacoteParaDesativar, setPacoteParaDesativar] = useState<Pacote | null>(null);
  const [filtroStatus, setFiltroStatus] = useState<FiltroStatus>("todos");
  const { enviando, executar: executarSalvar } = useMutacaoApi();
  const { executar: executarAlternar } = useMutacaoApi();
  const { enviando: desativando, executar: executarDesativar } = useMutacaoApi();
  const { enviando: excluindo, executar: executarExcluir } = useMutacaoApi();

  const pacotesFiltrados = pacotes.filter((pacote) => {
    if (filtroStatus === "ativo") return pacote.ativo;
    if (filtroStatus === "inativo") return !pacote.ativo;
    return true;
  });

  // Ao editar um pacote cujo serviço foi desativado, ele continua como opção
  // para o formulário não perder o valor atual.
  const opcoesServico = servicos.map((servico) => ({ value: servico.id, label: servico.nome }));
  if (pacoteEditando && !opcoesServico.some((opcao) => opcao.value === pacoteEditando.servicoId)) {
    opcoesServico.push({ value: pacoteEditando.servicoId, label: pacoteEditando.servicoNome });
  }

  function abrirNovo() {
    setPacoteEditando(null);
    setServicoId("");
    setModalAberto(true);
  }

  function abrirEdicao(pacote: Pacote) {
    setPacoteEditando(pacote);
    setServicoId(pacote.servicoId);
    setModalAberto(true);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    const payload = {
      servicoId,
      quantidadeSessoes: Number(formData.get("quantidadeSessoes")),
      valor: Number(formData.get("valor")),
      validadeDias: Number(formData.get("validadeDias")),
    };

    const url = pacoteEditando ? `/api/pacotes/${pacoteEditando.id}` : "/api/pacotes";
    const method = pacoteEditando ? "PATCH" : "POST";

    await executarSalvar(
      () =>
        fetch(url, {
          method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }),
      {
        mensagemSucesso: pacoteEditando ? "Pacote atualizado com sucesso." : "Pacote criado com sucesso.",
        mensagemErroPadrao: "Não foi possível salvar o pacote.",
        aoSucesso: () => {
          setModalAberto(false);
          router.refresh();
        },
      },
    );
  }

  async function alternarAtivo(pacote: Pacote) {
    await executarAlternar(
      () =>
        fetch(`/api/pacotes/${pacote.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ativo: !pacote.ativo }),
        }),
      {
        mensagemSucesso: pacote.ativo ? "Pacote desativado." : "Pacote ativado.",
        mensagemErroPadrao: "Não foi possível atualizar o pacote.",
        aoSucesso: () => router.refresh(),
      },
    );
  }

  function pedirDesativacao(pacote: Pacote) {
    if (!pacote.ativo) {
      alternarAtivo(pacote);
      return;
    }
    setPacoteParaDesativar(pacote);
  }

  async function confirmarDesativacao() {
    if (!pacoteParaDesativar) return;
    await executarDesativar(
      () =>
        fetch(`/api/pacotes/${pacoteParaDesativar.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ativo: false }),
        }),
      {
        mensagemSucesso: "Pacote desativado.",
        mensagemErroPadrao: "Não foi possível desativar o pacote.",
        aoSucesso: () => {
          setPacoteParaDesativar(null);
          router.refresh();
        },
      },
    );
  }

  async function confirmarExclusao() {
    if (!pacoteParaExcluir) return;
    await executarExcluir(() => fetch(`/api/pacotes/${pacoteParaExcluir.id}`, { method: "DELETE" }), {
      mensagemSucesso: "Pacote excluído.",
      mensagemErroPadrao: "Não foi possível excluir o pacote.",
      aoSucesso: () => {
        setPacoteParaExcluir(null);
        router.refresh();
      },
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">
          Gestão de Pacotes
        </h1>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="w-full sm:w-40">
            <Select
              value={filtroStatus}
              onChange={(valor) => setFiltroStatus(valor as FiltroStatus)}
              options={OPCOES_FILTRO_STATUS}
              size="sm"
            />
          </div>
          <Button type="button" size="sm" className="w-full sm:w-auto" onClick={abrirNovo}>
            <Plus size={18} />
            Novo pacote
          </Button>
        </div>
      </div>

      {pacotes.length === 0 ? (
        <p className="text-ink-muted">Nenhum pacote cadastrado ainda.</p>
      ) : pacotesFiltrados.length === 0 ? (
        <p className="text-ink-muted">Nenhum pacote encontrado para esse filtro.</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {pacotesFiltrados.map((pacote) => (
            <div key={pacote.id} className="flex h-full flex-col gap-3 rounded-3xl bg-cream-dark p-6">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h3 className="font-bold text-ink">{rotuloSessoes(pacote.quantidadeSessoes)}</h3>
                  <p className="truncate text-sm text-ink-muted">{pacote.servicoNome}</p>
                </div>
                <span
                  className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${
                    pacote.ativo ? "bg-success-bg text-success" : "bg-input text-ink-muted"
                  }`}
                >
                  {pacote.ativo ? "Ativo" : "Inativo"}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm text-ink-muted">
                <span>Validade: {pacote.validadeDias} dias</span>
                <span className="font-semibold text-ink">{formatarMoeda(pacote.valor)}</span>
              </div>
              <div className="mt-auto flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => abrirEdicao(pacote)}
                  className="flex flex-1 items-center justify-center gap-2 rounded-full border border-input-border py-2 text-sm font-medium text-ink hover:bg-cream"
                >
                  <Pencil size={16} />
                  Editar
                </button>
                <button
                  type="button"
                  onClick={() => pedirDesativacao(pacote)}
                  className="flex-1 rounded-full border border-input-border py-2 text-sm font-medium text-ink hover:bg-cream"
                >
                  {pacote.ativo ? "Desativar" : "Ativar"}
                </button>
                <button
                  type="button"
                  onClick={() => setPacoteParaExcluir(pacote)}
                  aria-label={`Excluir pacote de ${rotuloSessoes(pacote.quantidadeSessoes)} de ${pacote.servicoNome}`}
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
        title={pacoteEditando ? "Editar pacote" : "Novo pacote"}
        footer={
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setModalAberto(false)}
              className="min-w-0 flex-1 rounded-full border border-input-border py-2 text-sm font-semibold text-ink hover:bg-cream-dark"
            >
              Cancelar
            </button>
            <Button
              type="submit"
              form="form-pacote"
              size="sm"
              disabled={enviando || !servicoId}
              className="min-w-0 flex-1"
            >
              {enviando ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        }
      >
        <form id="form-pacote" onSubmit={handleSubmit} className="flex flex-col gap-4 py-2">
          <Select
            label="Serviço"
            placeholder="Selecione um serviço"
            value={servicoId}
            onChange={setServicoId}
            options={opcoesServico}
          />
          <div className="grid grid-cols-2 gap-4">
            <TextField
              id="quantidadeSessoes"
              name="quantidadeSessoes"
              type="number"
              min={1}
              step={1}
              label="Sessões"
              required
              defaultValue={pacoteEditando?.quantidadeSessoes}
            />
            <TextField
              id="validadeDias"
              name="validadeDias"
              type="number"
              min={1}
              step={1}
              label="Validade (dias)"
              required
              defaultValue={pacoteEditando?.validadeDias}
            />
          </div>
          <TextField
            id="valor"
            name="valor"
            type="number"
            min={0}
            step="0.01"
            label="Valor do pacote (R$)"
            required
            defaultValue={pacoteEditando?.valor}
          />
          {pacoteEditando && (
            <p className="text-sm text-ink-muted">
              Alterações valem só para novas atribuições; pacotes que já foram atribuídos a clientes não mudam.
            </p>
          )}
        </form>
      </Modal>

      <ConfirmModal
        open={pacoteParaExcluir !== null}
        title="Excluir pacote"
        message={
          pacoteParaExcluir
            ? `Tem certeza que deseja excluir o pacote de ${rotuloSessoes(pacoteParaExcluir.quantidadeSessoes)} de "${pacoteParaExcluir.servicoNome}"? Essa ação não pode ser desfeita.`
            : ""
        }
        confirmLabel="Excluir"
        confirming={excluindo}
        onConfirm={confirmarExclusao}
        onCancel={() => setPacoteParaExcluir(null)}
      />

      <ConfirmModal
        open={pacoteParaDesativar !== null}
        title="Desativar pacote"
        message={
          pacoteParaDesativar
            ? `Tem certeza que deseja desativar o pacote de ${rotuloSessoes(pacoteParaDesativar.quantidadeSessoes)} de "${pacoteParaDesativar.servicoNome}"? Ele deixará de poder ser atribuído a clientes; quem já tem o pacote continua usando.`
            : ""
        }
        confirmLabel="Desativar"
        confirmingLabel="Desativando..."
        confirming={desativando}
        onConfirm={confirmarDesativacao}
        onCancel={() => setPacoteParaDesativar(null)}
      />
    </div>
  );
}
