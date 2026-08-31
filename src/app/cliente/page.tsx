import Link from "next/link";
import { CalendarPlus, Sparkles } from "lucide-react";
import { redirect } from "next/navigation";
import { obterSessao } from "@/lib/auth";
import { obterClientePorUsuarioId } from "@/services/cliente.service";
import { obterProximoAgendamentoCliente } from "@/services/agendamento.service";
import { listarServicos } from "@/services/servico.service";
import { formatarDiaSemanaEData, saudacaoPorHorarioBrasil } from "@/utils/data";
import { SugestoesCarrossel } from "@/components/cliente/SugestoesCarrossel";

export default async function ClienteInicioPage() {
  const sessao = await obterSessao();
  if (!sessao) redirect("/login");

  const cliente = await obterClientePorUsuarioId(sessao.sub);
  if (!cliente) redirect("/login");

  const primeiroNome = cliente.nome.split(" ")[0];

  const [proximo, servicos] = await Promise.all([
    obterProximoAgendamentoCliente(cliente.id),
    listarServicos(),
  ]);

  const sugestoes = servicos.filter((s) => s.ativo);
  const saudacao = saudacaoPorHorarioBrasil();

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-light tracking-tight text-ink sm:text-4xl">
          {saudacao}, <span className="font-medium text-brand">{primeiroNome}</span>.
        </h1>
        <p className="text-lg text-ink-muted">Seu momento de pausa e reconexão começa aqui.</p>
      </div>

      <Link
        href="/cliente/novo-agendamento"
        className="flex w-fit items-center gap-2 rounded-full bg-brand px-6 py-3 text-base font-semibold text-white shadow-[0px_12px_16px_rgba(26,28,25,0.06)] transition-opacity hover:opacity-90"
      >
        <CalendarPlus size={18} />
        Agendar Agora
      </Link>

      <div className="flex flex-col gap-6">
        <h2 className="text-2xl font-medium text-ink">Sua Próxima Sessão</h2>

        {proximo ? (
          <div className="rounded-3xl bg-cream-dark p-3">
            <div className="flex flex-col gap-6 rounded-[28px] bg-white p-6 sm:p-8">
              <span className="w-fit rounded-full bg-confirmado-bg px-4 py-2 text-sm font-medium text-confirmado-text">
                {proximo.status === "confirmado" ? "Confirmado" : "Pendente de confirmação"}
              </span>
              <div className="flex flex-col gap-1">
                <h3 className="text-2xl font-medium text-brand sm:text-3xl">{proximo.servicoNome}</h3>
                <p className="text-lg text-ink-muted">
                  {formatarDiaSemanaEData(proximo.dataHoraInicio.slice(0, 10))} às{" "}
                  {new Date(proximo.dataHoraInicio).toLocaleTimeString("pt-BR", {
                    timeZone: "America/Sao_Paulo",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}{" "}
                  • Duração: {proximo.duracaoMinutos} min
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-3xl bg-cream-dark p-8 text-center">
            <p className="text-ink-muted">Você ainda não tem sessões agendadas.</p>
            <Link href="/cliente/novo-agendamento" className="mt-2 inline-block font-medium text-brand">
              Agendar agora
            </Link>
          </div>
        )}
      </div>

      {sugestoes.length > 0 && (
        <div className="flex flex-col gap-6">
          <h2 className="flex items-center gap-2 text-2xl font-medium text-ink">
            <Sparkles size={20} className="text-brand" />
            Sugestões para Você
          </h2>
          <SugestoesCarrossel servicos={sugestoes} />
        </div>
      )}
    </div>
  );
}
