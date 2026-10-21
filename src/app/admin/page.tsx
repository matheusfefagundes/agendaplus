import {
  CalendarCheck2,
  CalendarClock,
  CalendarRange,
  CalendarX2,
  Receipt,
  UserRoundPlus,
  Wallet,
} from "lucide-react";
import dynamic from "next/dynamic";
import { obterSessao } from "@/lib/auth";
import CartaoMetrica from "@/components/admin/dashboard/CartaoMetrica";
import EsqueletoGrafico from "@/components/admin/dashboard/EsqueletoGrafico";
import {
  obterAgendamentosPorStatusMes,
  obterFaturamentoDiario,
  obterNomeUsuario,
  obterProximosAgendamentos,
  obterResumoDashboard,
  obterServicosMaisVendidosMes,
} from "@/services/dashboard.service";
import {
  formatarHorario,
  formatarMoeda,
  formatarPercentual,
} from "@/utils/formatters";

const GraficoFaturamento = dynamic(
  () => import("@/components/admin/dashboard/GraficoFaturamento"),
  { loading: () => <EsqueletoGrafico altura={256} /> },
);
const GraficoStatusAgendamentos = dynamic(
  () => import("@/components/admin/dashboard/GraficoStatusAgendamentos"),
  { loading: () => <EsqueletoGrafico altura={192} /> },
);
const GraficoServicosMaisVendidos = dynamic(
  () => import("@/components/admin/dashboard/GraficoServicosMaisVendidos"),
  { loading: () => <EsqueletoGrafico altura={180} /> },
);

function saudacao(): string {
  const hora = new Date().getHours();
  if (hora < 12) return "Bom dia";
  if (hora < 18) return "Boa tarde";
  return "Boa noite";
}

export default async function AdminDashboardPage() {
  const sessao = await obterSessao();
  const [nome, resumo, proximos, faturamentoDiario, statusMes, servicosMes] =
    await Promise.all([
      sessao ? obterNomeUsuario(sessao.sub) : null,
      obterResumoDashboard(),
      obterProximosAgendamentos(),
      obterFaturamentoDiario(14),
      obterAgendamentosPorStatusMes(),
      obterServicosMaisVendidosMes(),
    ]);

  const primeiroNome = nome?.split(" ")[0] ?? "";

  return (
    <div className="flex flex-col gap-8">
      <header>
        <h1 className="text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">
          {saudacao()}
          {primeiroNome ? `, ${primeiroNome}.` : "."}
        </h1>
        <p className="mt-1 text-ink-muted">
          Aqui está o resumo da sua clínica hoje.
        </p>
      </header>

      <section className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <CartaoMetrica
          icone={CalendarCheck2}
          label="Atendimentos Hoje"
          valor={String(resumo.atendimentosHoje)}
        />
        <CartaoMetrica
          icone={CalendarRange}
          label="Atendimentos no Mês"
          valor={String(resumo.atendimentosMes)}
        />
        <CartaoMetrica
          icone={UserRoundPlus}
          label="Novos Clientes"
          valor={String(resumo.novosClientesSemana)}
          descricao="Na semana"
        />
        <CartaoMetrica
          icone={Wallet}
          label="Faturamento"
          valor={formatarMoeda(resumo.faturamentoSemana)}
          descricao="Na semana"
        />
        <CartaoMetrica
          icone={Receipt}
          label="Ticket Médio"
          valor={formatarMoeda(resumo.ticketMedioMes)}
          descricao="No mês"
        />
        <CartaoMetrica
          icone={CalendarX2}
          label="Cancelamento"
          valor={formatarPercentual(resumo.taxaCancelamentoMes)}
          descricao="No mês"
        />
      </section>

      <GraficoFaturamento dados={faturamentoDiario} />

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <GraficoStatusAgendamentos dados={statusMes} />
        <GraficoServicosMaisVendidos dados={servicosMes} />
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
                    <p className="font-medium text-ink">
                      {agendamento.clienteNome}
                    </p>
                    <p className="text-sm text-ink-muted">
                      {agendamento.servicoNome}
                    </p>
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
