import { redirect } from "next/navigation";
import { obterSessao } from "@/lib/auth";
import { obterClientePorUsuarioId } from "@/services/cliente.service";
import { listarAgendamentosHistoricoCliente } from "@/services/agendamento.service";
import { listarServicos } from "@/services/servico.service";
import { HistoricoList } from "@/components/cliente/HistoricoList";

const LIMITE_POR_PAGINA = 5;

export default async function HistoricoPage() {
  const sessao = await obterSessao();
  if (!sessao) redirect("/login");

  const cliente = await obterClientePorUsuarioId(sessao.sub);
  if (!cliente) redirect("/login");

  const [{ agendamentos, temMais }, servicos] = await Promise.all([
    listarAgendamentosHistoricoCliente(cliente.id, {}, LIMITE_POR_PAGINA, 0),
    listarServicos(),
  ]);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold tracking-tight text-ink sm:text-4xl">Histórico de Atendimentos</h1>
        <p className="max-w-2xl text-lg text-ink-muted">
          Revise as suas sessões e acompanhe os serviços realizados e cancelamentos em um só lugar.
        </p>
      </div>

      <HistoricoList agendamentosIniciais={agendamentos} temMaisInicial={temMais} servicos={servicos} />
    </div>
  );
}
