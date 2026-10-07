"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, type ChangeEvent, type DragEvent, type FormEvent } from "react";
import { Pencil, Plus, Trash2, UploadCloud } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { Textarea } from "@/components/ui/Textarea";
import { Modal } from "@/components/ui/Modal";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { Select } from "@/components/ui/Select";
import { useMutacaoApi } from "@/hooks/useMutacaoApi";
import { toast } from "@/lib/toast";
import { formatarMoeda } from "@/utils/formatters";
import { urlFotoServico } from "@/utils/servicoFoto";
import type { Servico } from "@/types/servico";

type ServicosManagerProps = {
  servicos: Servico[];
};

type FiltroStatus = "todos" | "ativo" | "inativo";

const OPCOES_FILTRO_STATUS = [
  { value: "todos", label: "Todos" },
  { value: "ativo", label: "Ativos" },
  { value: "inativo", label: "Inativos" },
];

export function ServicosManager({ servicos }: ServicosManagerProps) {
  const router = useRouter();
  const [modalAberto, setModalAberto] = useState(false);
  const [servicoEditando, setServicoEditando] = useState<Servico | null>(null);
  const [servicoParaExcluir, setServicoParaExcluir] = useState<Servico | null>(null);
  const [servicoParaDesativar, setServicoParaDesativar] = useState<Servico | null>(null);
  const [filtroStatus, setFiltroStatus] = useState<FiltroStatus>("todos");
  const [arquivoFoto, setArquivoFoto] = useState<File | null>(null);
  const [removerFotoSolicitado, setRemoverFotoSolicitado] = useState(false);
  const [arrastandoSobre, setArrastandoSobre] = useState(false);
  const inputFotoRef = useRef<HTMLInputElement>(null);
  const { enviando, executar: executarSalvar } = useMutacaoApi();
  const { executar: executarAlternar } = useMutacaoApi();
  const { enviando: desativando, executar: executarDesativar } = useMutacaoApi();
  const { enviando: excluindo, executar: executarExcluir } = useMutacaoApi();

  const servicosFiltrados = servicos.filter((servico) => {
    if (filtroStatus === "ativo") return servico.ativo;
    if (filtroStatus === "inativo") return !servico.ativo;
    return true;
  });

  function resetarEstadoFoto() {
    setArquivoFoto(null);
    setRemoverFotoSolicitado(false);
  }

  function abrirNovo() {
    setServicoEditando(null);
    resetarEstadoFoto();
    setModalAberto(true);
  }

  function abrirEdicao(servico: Servico) {
    setServicoEditando(servico);
    resetarEstadoFoto();
    setModalAberto(true);
  }

  function definirArquivoFoto(arquivo: File | null) {
    if (arquivo && !arquivo.type.startsWith("image/")) {
      toast.danger("Selecione um arquivo de imagem.");
      return;
    }
    setArquivoFoto(arquivo);
    setRemoverFotoSolicitado(false);
  }

  function selecionarArquivoFoto(event: ChangeEvent<HTMLInputElement>) {
    definirArquivoFoto(event.target.files?.[0] ?? null);
  }

  function aoSoltarArquivo(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setArrastandoSobre(false);
    definirArquivoFoto(event.dataTransfer.files?.[0] ?? null);
  }

  function removerFoto() {
    setArquivoFoto(null);
    setRemoverFotoSolicitado(true);
    if (inputFotoRef.current) inputFotoRef.current.value = "";
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
        mensagemSucesso: servicoEditando ? "Serviço atualizado com sucesso." : "Serviço criado com sucesso.",
        mensagemErroPadrao: "Não foi possível salvar o serviço.",
        aoSucesso: async (resposta) => {
          const { servico } = resposta as { servico: Servico };

          if (arquivoFoto) {
            const fotoForm = new FormData();
            fotoForm.append("foto", arquivoFoto);
            const respostaFoto = await fetch(`/api/servicos/${servico.id}/foto`, {
              method: "POST",
              body: fotoForm,
            });
            if (!respostaFoto.ok) {
              const erro = await respostaFoto.json().catch(() => ({}));
              toast.danger(erro.error ?? "Serviço salvo, mas não foi possível enviar a foto.");
            }
          } else if (removerFotoSolicitado) {
            await fetch(`/api/servicos/${servico.id}/foto`, { method: "DELETE" });
          }

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

  function pedirDesativacao(servico: Servico) {
    if (!servico.ativo) {
      alternarAtivo(servico);
      return;
    }
    setServicoParaDesativar(servico);
  }

  async function confirmarDesativacao() {
    if (!servicoParaDesativar) return;
    await executarDesativar(
      () =>
        fetch(`/api/servicos/${servicoParaDesativar.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ativo: false }),
        }),
      {
        mensagemSucesso: "Serviço desativado.",
        mensagemErroPadrao: "Não foi possível desativar o serviço.",
        aoSucesso: () => {
          setServicoParaDesativar(null);
          router.refresh();
        },
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
            Novo serviço
          </Button>
        </div>
      </div>

      {servicos.length === 0 ? (
        <p className="text-ink-muted">Nenhum serviço cadastrado ainda.</p>
      ) : servicosFiltrados.length === 0 ? (
        <p className="text-ink-muted">Nenhum serviço encontrado para esse filtro.</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {servicosFiltrados.map((servico) => (
            <div
              key={servico.id}
              className="flex h-full flex-col gap-3 rounded-3xl bg-cream-dark p-6"
            >
              {urlFotoServico(servico) && (
                <img
                  src={urlFotoServico(servico) ?? undefined}
                  alt=""
                  className="h-32 w-full rounded-2xl object-cover"
                />
              )}
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
                  onClick={() => pedirDesativacao(servico)}
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
              form="form-servico"
              size="sm"
              disabled={enviando}
              className="min-w-0 flex-1"
            >
              {enviando ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        }
      >
        <form id="form-servico" onSubmit={handleSubmit} className="flex flex-col gap-4 py-2">
          <div className="flex flex-col gap-1.5">
            <span className="text-sm text-ink">Foto do serviço</span>
            <div
              onClick={() => inputFotoRef.current?.click()}
              onDragOver={(event) => {
                event.preventDefault();
                setArrastandoSobre(true);
              }}
              onDragLeave={() => setArrastandoSobre(false)}
              onDrop={aoSoltarArquivo}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  inputFotoRef.current?.click();
                }
              }}
              role="button"
              tabIndex={0}
              className={`relative flex cursor-pointer flex-col items-center gap-1 rounded-2xl border-2 border-dashed px-4 py-6 text-center transition-colors ${
                arrastandoSobre ? "border-brand bg-input" : "border-input-border bg-cream-dark hover:bg-input"
              }`}
            >
              {(arquivoFoto || (servicoEditando?.temFoto && !removerFotoSolicitado)) && (
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    removerFoto();
                  }}
                  aria-label="Remover foto"
                  className="absolute right-3 top-3 text-ink-muted hover:text-danger"
                >
                  <Trash2 size={16} />
                </button>
              )}
              <UploadCloud size={20} className="text-ink-muted" />
              <p className="text-sm font-medium text-ink">Clique ou arraste a imagem aqui</p>
              <p className="max-w-full truncate text-xs text-ink-muted">
                {arquivoFoto?.name ??
                  (servicoEditando?.temFoto && !removerFotoSolicitado
                    ? "Foto atual mantida"
                    : "Nenhum arquivo selecionado")}
              </p>
              <p className="text-xs text-ink-muted">Formatos aceitos: JPG, PNG ou WebP · até 8MB</p>
              <input
                ref={inputFotoRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={selecionarArquivoFoto}
              />
            </div>
          </div>
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

      <ConfirmModal
        open={servicoParaDesativar !== null}
        title="Desativar serviço"
        message={
          servicoParaDesativar
            ? `Tem certeza que deseja desativar "${servicoParaDesativar.nome}"? Ele deixará de aparecer para novos agendamentos.`
            : ""
        }
        confirmLabel="Desativar"
        confirmingLabel="Desativando..."
        confirming={desativando}
        onConfirm={confirmarDesativacao}
        onCancel={() => setServicoParaDesativar(null)}
      />
    </div>
  );
}
