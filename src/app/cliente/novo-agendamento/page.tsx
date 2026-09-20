import { redirect } from "next/navigation";
import { obterSessao } from "@/lib/auth";
import { obterClientePorUsuarioId } from "@/services/cliente.service";
import { listarPacotesDoCliente } from "@/services/pacote-cliente.service";
import { listarServicos } from "@/services/servico.service";
import { calcularSaldoPorServico } from "@/utils/pacote";
import { NovoAgendamentoForm } from "@/components/cliente/NovoAgendamentoForm";

export default async function NovoAgendamentoPage() {
  const sessao = await obterSessao();
  if (!sessao) redirect("/login");

  const cliente = await obterClientePorUsuarioId(sessao.sub);
  if (!cliente) redirect("/login");

  const [servicos, pacotes] = await Promise.all([listarServicos(), listarPacotesDoCliente(cliente.id)]);
  const ativos = servicos.filter((s) => s.ativo);
  const saldos = calcularSaldoPorServico(pacotes);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold tracking-tight text-ink sm:text-4xl">Agende seu momento</h1>
      </div>

      {ativos.length === 0 ? (
        <p className="text-ink-muted">Nenhum serviço disponível para agendamento no momento.</p>
      ) : (
        <NovoAgendamentoForm servicos={ativos} saldos={saldos} />
      )}
    </div>
  );
}
