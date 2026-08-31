import { redirect } from "next/navigation";
import { obterSessao } from "@/lib/auth";
import { obterClientePorUsuarioId } from "@/services/cliente.service";
import { listarAgendamentosFuturosCliente } from "@/services/agendamento.service";
import { MeusAgendamentosList } from "@/components/cliente/MeusAgendamentosList";

export default async function MeusAgendamentosPage() {
  const sessao = await obterSessao();
  if (!sessao) redirect("/login");

  const cliente = await obterClientePorUsuarioId(sessao.sub);
  if (!cliente) redirect("/login");

  const agendamentos = await listarAgendamentosFuturosCliente(cliente.id);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold tracking-tight text-ink sm:text-4xl">Meus Agendamentos</h1>
        <p className="text-lg text-ink-muted">Suas sessões marcadas</p>
      </div>

      <MeusAgendamentosList agendamentos={agendamentos} />
    </div>
  );
}
