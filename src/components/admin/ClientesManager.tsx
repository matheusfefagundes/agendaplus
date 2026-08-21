"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, type FormEvent } from "react";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import { TextField } from "@/components/ui/TextField";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";
import { useMutacaoApi } from "@/hooks/useMutacaoApi";
import type { ClienteDetalhe } from "@/types/cliente";

const CLIENTES_POR_PAGINA = 10;

type ClientesManagerProps = {
  clientes: ClienteDetalhe[];
};

export function ClientesManager({ clientes }: ClientesManagerProps) {
  const router = useRouter();
  const [busca, setBusca] = useState("");
  const [buscaAnterior, setBuscaAnterior] = useState(busca);
  const [pagina, setPagina] = useState(1);
  const [selecionadoId, setSelecionadoId] = useState<string | null>(clientes[0]?.id ?? null);
  const { enviando, executar: executarSalvar } = useMutacaoApi();
  const { executar: executarAlternar } = useMutacaoApi();

  const filtrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    if (!termo) return clientes;
    return clientes.filter(
      (c) =>
        c.nome.toLowerCase().includes(termo) ||
        c.email.toLowerCase().includes(termo) ||
        (c.telefone ?? "").toLowerCase().includes(termo),
    );
  }, [clientes, busca]);

  const totalPaginas = Math.max(1, Math.ceil(filtrados.length / CLIENTES_POR_PAGINA));

  if (busca !== buscaAnterior) {
    setBuscaAnterior(busca);
    setPagina(1);
  }

  const paginados = useMemo(() => {
    const inicio = (pagina - 1) * CLIENTES_POR_PAGINA;
    return filtrados.slice(inicio, inicio + CLIENTES_POR_PAGINA);
  }, [filtrados, pagina]);

  const selecionado = clientes.find((c) => c.id === selecionadoId) ?? paginados[0] ?? null;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selecionado) return;
    const formData = new FormData(event.currentTarget);

    const payload = {
      telefone: String(formData.get("telefone") ?? "").trim() || null,
      observacoesClinicas: String(formData.get("observacoesClinicas") ?? "").trim() || null,
    };

    await executarSalvar(
      () =>
        fetch(`/api/clientes/${selecionado.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }),
      {
        mensagemSucesso: "Dados do cliente atualizados.",
        mensagemErroPadrao: "Não foi possível salvar.",
        aoSucesso: () => router.refresh(),
      },
    );
  }

  async function alternarAtivo() {
    if (!selecionado) return;
    await executarAlternar(
      () =>
        fetch(`/api/clientes/${selecionado.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ativo: !selecionado.ativo }),
        }),
      {
        mensagemSucesso: selecionado.ativo ? "Cliente desativado." : "Cliente reativado.",
        mensagemErroPadrao: "Não foi possível atualizar.",
        aoSucesso: () => router.refresh(),
      },
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">
        Gestão de Clientes
      </h1>

      <TextField
        id="busca"
        name="busca"
        label="Buscar"
        placeholder="Nome, e-mail ou telefone"
        icon={<Search size={18} />}
        value={busca}
        onChange={(e) => setBusca(e.target.value)}
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_1.3fr]">
        <div className="flex flex-col gap-2">
          {paginados.length === 0 ? (
            <p className="text-ink-muted">Nenhum cliente encontrado.</p>
          ) : (
            paginados.map((cliente) => (
              <button
                key={cliente.id}
                type="button"
                onClick={() => setSelecionadoId(cliente.id)}
                className={`flex items-center justify-between rounded-2xl px-4 py-3 text-left transition-colors ${
                  selecionado?.id === cliente.id
                    ? "bg-brand text-white"
                    : "bg-cream-dark text-ink hover:bg-input"
                }`}
              >
                <div className="min-w-0">
                  <p className="truncate font-medium">{cliente.nome}</p>
                  <p
                    className={`truncate text-sm ${
                      selecionado?.id === cliente.id ? "text-white/80" : "text-ink-muted"
                    }`}
                  >
                    {cliente.email}
                  </p>
                </div>
                {!cliente.ativo && (
                  <span className="ml-2 shrink-0 rounded-full bg-input px-2 py-0.5 text-xs font-semibold text-ink-muted">
                    Inativo
                  </span>
                )}
              </button>
            ))
          )}

          {filtrados.length > 0 && (
            <div className="mt-2 flex items-center justify-between text-sm text-ink-muted">
              <button
                type="button"
                onClick={() => setPagina((p) => Math.max(1, p - 1))}
                disabled={pagina === 1}
                aria-label="Página anterior"
                className="text-black flex items-center gap-1 rounded-full border border-input-border px-3 py-1.5 disabled:opacity-50 hover:bg-input"
              >
                <ChevronLeft size={16} />
                Anterior
              </button>
              <span className="text-black">
                Página {pagina} de {totalPaginas}
              </span>
              <button
                type="button"
                onClick={() => setPagina((p) => Math.min(totalPaginas, p + 1))}
                disabled={pagina === totalPaginas}
                aria-label="Próxima página"
                className="text-black flex items-center gap-1 rounded-full border border-input-border px-3 py-1.5 disabled:opacity-50 hover:bg-input"
              >
                Próxima
                <ChevronRight size={16} />
              </button>
            </div>
          )}
        </div>

        <div className="h-fit rounded-3xl bg-cream-dark p-6 lg:sticky lg:top-8">
          {!selecionado ? (
            <p className="text-ink-muted">Selecione um cliente para ver os detalhes.</p>
          ) : (
            <form key={selecionado.id} onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="truncate text-xl font-bold text-ink">{selecionado.nome}</h2>
                  <p className="truncate text-sm text-ink-muted">{selecionado.email}</p>
                </div>
                <button
                  type="button"
                  onClick={alternarAtivo}
                  className="shrink-0 rounded-full border border-input-border px-4 py-1.5 text-sm font-medium text-ink hover:bg-cream"
                >
                  {selecionado.ativo ? "Desativar" : "Reativar"}
                </button>
              </div>

              <TextField
                id="telefone"
                name="telefone"
                label="Telefone"
                defaultValue={selecionado.telefone ?? ""}
              />
              <Textarea
                id="observacoesClinicas"
                name="observacoesClinicas"
                label="Observações clínicas"
                rows={4}
                defaultValue={selecionado.observacoesClinicas ?? ""}
              />

              <Button type="submit" size="sm" disabled={enviando} className="mt-2 sm:w-auto">
                {enviando ? "Salvando..." : "Salvar alterações"}
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
