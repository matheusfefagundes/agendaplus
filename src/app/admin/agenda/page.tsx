import { AgendaCalendario } from "@/components/admin/AgendaCalendario";
import { listarAgendamentosPeriodo } from "@/services/agendamento.service";
import { listarHorarios } from "@/services/horario.service";
import { adicionarDias, domingoDaSemana, hojeEmSaoPauloISO, inicioDoDiaBrasil } from "@/utils/data";

type AdminAgendaPageProps = {
  searchParams: Promise<{ inicio?: string }>;
};

export default async function AdminAgendaPage({ searchParams }: AdminAgendaPageProps) {
  const { inicio } = await searchParams;
  const hoje = hojeEmSaoPauloISO();
  const domingo = domingoDaSemana(inicio ?? hoje);
  const proximoDomingo = adicionarDias(domingo, 7);

  const [agendamentos, horarios] = await Promise.all([
    listarAgendamentosPeriodo(inicioDoDiaBrasil(domingo), inicioDoDiaBrasil(proximoDomingo)),
    listarHorarios(),
  ]);

  return (
    <AgendaCalendario domingo={domingo} hoje={hoje} agendamentos={agendamentos} horarios={horarios} />
  );
}
