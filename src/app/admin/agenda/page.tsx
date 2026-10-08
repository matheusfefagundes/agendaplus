import { AgendaCalendario } from "@/components/admin/AgendaCalendario";
import {
  listarAgendamentosPeriodo,
  listarProximosAgendamentos,
} from "@/services/agendamento.service";
import {
  adicionarDias,
  diasDaGradeDoMes,
  hojeEmSaoPauloISO,
  inicioDoDiaBrasil,
  mesDaData,
} from "@/utils/data";

const MES_REGEX = /^\d{4}-(0[1-9]|1[0-2])$/;
const LIMITE_PROXIMOS = 5;

type AdminAgendaPageProps = {
  searchParams: Promise<{ mes?: string }>;
};

export default async function AdminAgendaPage({
  searchParams,
}: AdminAgendaPageProps) {
  const { mes: mesParam } = await searchParams;
  const hoje = hojeEmSaoPauloISO();
  const mes = mesParam && MES_REGEX.test(mesParam) ? mesParam : mesDaData(hoje);
  const dias = diasDaGradeDoMes(mes);

  const [agendamentos, proximos] = await Promise.all([
    listarAgendamentosPeriodo(
      inicioDoDiaBrasil(dias[0]),
      inicioDoDiaBrasil(adicionarDias(dias[dias.length - 1], 1)),
    ),
    listarProximosAgendamentos(LIMITE_PROXIMOS),
  ]);

  return (
    <AgendaCalendario
      mes={mes}
      hoje={hoje}
      agendamentos={agendamentos}
      proximos={proximos}
    />
  );
}
