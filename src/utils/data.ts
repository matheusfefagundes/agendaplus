const FUSO_HORARIO = "America/Sao_Paulo";
const OFFSET_BRASIL = "-03:00";

export const DIAS_SEMANA = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

export function hojeEmSaoPauloISO(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: FUSO_HORARIO }).format(new Date());
}

export function adicionarDias(dataISO: string, dias: number): string {
  const [ano, mes, dia] = dataISO.split("-").map(Number);
  const data = new Date(Date.UTC(ano, mes - 1, dia));
  data.setUTCDate(data.getUTCDate() + dias);
  return data.toISOString().slice(0, 10);
}

export function domingoDaSemana(dataISO: string): string {
  const [ano, mes, dia] = dataISO.split("-").map(Number);
  const base = new Date(Date.UTC(ano, mes - 1, dia));
  return adicionarDias(dataISO, -base.getUTCDay());
}

// Constrói o instante exato de meia-noite no fuso da clínica (Brasil não tem
// mais horário de verão, então o offset fixo -03:00 é seguro).
export function inicioDoDiaBrasil(dataISO: string): Date {
  return new Date(`${dataISO}T00:00:00${OFFSET_BRASIL}`);
}

// Data (YYYY-MM-DD) no fuso da clínica a partir de um timestamp ISO em UTC.
export function dataLocalBrasil(iso: string): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: FUSO_HORARIO }).format(new Date(iso));
}

// Minutos desde a meia-noite (fuso da clínica) a partir de um timestamp ISO.
export function minutosDoDiaBrasil(iso: string): number {
  const partes = new Intl.DateTimeFormat("pt-BR", {
    timeZone: FUSO_HORARIO,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date(iso));
  const hora = Number(partes.find((p) => p.type === "hour")?.value ?? 0);
  const minuto = Number(partes.find((p) => p.type === "minute")?.value ?? 0);
  return hora * 60 + minuto;
}

export function minutosDeHoraTexto(hora: string): number {
  const [h, m] = hora.split(":").map(Number);
  return h * 60 + (m || 0);
}

export function formatarDataCurta(dataISO: string): string {
  const [, mes, dia] = dataISO.split("-");
  return `${dia}/${mes}`;
}
