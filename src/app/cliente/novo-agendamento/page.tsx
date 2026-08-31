import { listarServicos } from "@/services/servico.service";
import { NovoAgendamentoForm } from "@/components/cliente/NovoAgendamentoForm";

export default async function NovoAgendamentoPage() {
  const servicos = await listarServicos();
  const ativos = servicos.filter((s) => s.ativo);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-light tracking-tight text-ink sm:text-4xl">Agende seu momento</h1>
      </div>

      {ativos.length === 0 ? (
        <p className="text-ink-muted">Nenhum serviço disponível para agendamento no momento.</p>
      ) : (
        <NovoAgendamentoForm servicos={ativos} />
      )}
    </div>
  );
}
