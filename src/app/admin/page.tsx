import { CalendarClock } from "lucide-react";
import { obterSessao } from "@/lib/auth";
import {
  obterNomeUsuario,
  obterProximosAgendamentos,
  obterResumoDashboard,
} from "@/services/dashboard.service";

function saudacao(): string {
  const hora = new Date().getHours();
  if (hora < 12) return "Bom dia";
  if (hora < 18) return "Boa tarde";
  return "Boa noite";
}

function formatarMoeda(valor: number): string {
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatarHorario(iso: string): string {
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function AdminDashboardPage() {
  const sessao = await obterSessao();
  const [nome, resumo, proximos] = await Promise.all([
    sessao ? obterNomeUsuario(sessao.sub) : null,
    obterResumoDashboard(),
    obterProximosAgendamentos(),
  ]);

  const primeiroNome = nome?.split(" ")[0] ?? "";

  return (
    <div className="flex flex-col gap-8">
      <header>
        <h1 className="text-3xl font-extrabold tracking-tight text-ink">
          {saudacao()}
          {primeiroNome ? `, ${primeiroNome}.` : "."}
        </h1>
        <p className="mt-1 text-ink-muted">Aqui está o resumo da sua clínica hoje.</p>
      </header>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-3xl bg-cream-dark p-6">
          <p className="text-sm text-ink-muted">Atendimentos Hoje</p>
          <p className="mt-2 text-3xl font-extrabold text-ink">{resumo.atendimentosHoje}</p>
        </div>
        <div className="rounded-3xl bg-cream-dark p-6">
          <p className="text-sm text-ink-muted">Novos Clientes (semana)</p>
          <p className="mt-2 text-3xl font-extrabold text-ink">{resumo.novosClientesSemana}</p>
        </div>
        <div className="rounded-3xl bg-cream-dark p-6">
          <p className="text-sm text-ink-muted">Faturamento Semanal</p>
          <p className="mt-2 text-3xl font-extrabold text-ink">
            {formatarMoeda(resumo.faturamentoSemana)}
          </p>
        </div>
      </section>

      <section className="rounded-3xl bg-cream-dark p-6">
        <h2 className="text-lg font-bold text-ink">Próximos Horários</h2>

        {proximos.length === 0 ? (
          <p className="mt-4 text-ink-muted">Nenhum agendamento próximo.</p>
        ) : (
          <ul className="mt-4 flex flex-col gap-3">
            {proximos.map((agendamento) => (
              <li
                key={agendamento.id}
                className="flex items-center justify-between rounded-2xl bg-cream px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-brand/15 text-brand">
                    <CalendarClock size={18} />
                  </div>
                  <div>
                    <p className="font-medium text-ink">{agendamento.clienteNome}</p>
                    <p className="text-sm text-ink-muted">{agendamento.servicoNome}</p>
                  </div>
                </div>
                <span className="text-sm font-medium text-ink-muted">
                  {formatarHorario(agendamento.dataHoraInicio)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
