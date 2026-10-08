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

export function formatarHoraDeMinutos(minutos: number): string {
  const h = String(Math.floor(minutos / 60)).padStart(2, "0");
  const m = String(minutos % 60).padStart(2, "0");
  return `${h}:${m}`;
}

export function diaDaSemana(dataISO: string): number {
  const [ano, mes, dia] = dataISO.split("-").map(Number);
  return new Date(Date.UTC(ano, mes - 1, dia)).getUTCDay();
}

export function saudacaoPorHorarioBrasil(): string {
  const hora = Number(
    new Intl.DateTimeFormat("pt-BR", { timeZone: FUSO_HORARIO, hour: "2-digit", hourCycle: "h23" }).format(
      new Date(),
    ),
  );
  if (hora < 12) return "Bom dia";
  if (hora < 18) return "Boa tarde";
  return "Boa noite";
}

export function formatarDataExtensa(dataISO: string): string {
  const [ano, mes, dia] = dataISO.split("-").map(Number);
  const data = new Date(Date.UTC(ano, mes - 1, dia));
  return new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC", day: "2-digit", month: "long", year: "numeric" }).format(
    data,
  );
}

export function formatarDiaEMes(dataISO: string): string {
  const [, mes, dia] = dataISO.split("-").map(Number);
  const data = new Date(Date.UTC(2000, mes - 1, dia));
  return `${dia} de ${new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC", month: "long" }).format(data)}`;
}

export function rotuloAgrupamentoData(dataISO: string): string {
  const hoje = hojeEmSaoPauloISO();
  if (dataISO === hoje) return `Hoje, ${formatarDiaEMes(dataISO)}`;
  if (dataISO === adicionarDias(hoje, -1)) return `Ontem, ${formatarDiaEMes(dataISO)}`;
  return formatarDiaSemanaEData(dataISO);
}

export function formatarDiaSemanaEData(dataISO: string): string {
  const [ano, mes, dia] = dataISO.split("-").map(Number);
  const data = new Date(Date.UTC(ano, mes - 1, dia));
  const diaSemana = new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC", weekday: "long" }).format(data);
  const diaSemanaCapitalizado = diaSemana.charAt(0).toUpperCase() + diaSemana.slice(1);
  return `${diaSemanaCapitalizado}, ${formatarDiaEMes(dataISO)}`;
}
export const MESES = [
  "janeiro", "fevereiro", "março", "abril", "maio", "junho",
  "julho", "agosto", "setembro", "outubro", "novembro", "dezembro",
];

// Mês no formato YYYY-MM.
export function mesDaData(dataISO: string): string {
  return dataISO.slice(0, 7);
}

export function adicionarMeses(mes: string, quantidade: number): string {
  const [ano, numeroMes] = mes.split("-").map(Number);
  const data = new Date(Date.UTC(ano, numeroMes - 1 + quantidade, 1));
  return data.toISOString().slice(0, 7);
}

// "Outubro de 2026"
export function formatarMesAno(mes: string): string {
  const [ano, numeroMes] = mes.split("-").map(Number);
  const nome = MESES[numeroMes - 1];
  return `${nome.charAt(0).toUpperCase()}${nome.slice(1)} de ${ano}`;
}

// "OUT"
export function abreviarMes(dataISO: string): string {
  const numeroMes = Number(dataISO.split("-")[1]);
  return MESES[numeroMes - 1].slice(0, 3).toUpperCase();
}

// Dias exibidos no calendário mensal: semanas completas (domingo a sábado)
// que cobrem o mês inteiro.
export function diasDaGradeDoMes(mes: string): string[] {
  const primeiroDia = `${mes}-01`;
  const ultimoDia = adicionarDias(`${adicionarMeses(mes, 1)}-01`, -1);
  const inicio = domingoDaSemana(primeiroDia);
  const fim = adicionarDias(domingoDaSemana(ultimoDia), 6);

  const dias: string[] = [];
  for (let dia = inicio; dia <= fim; dia = adicionarDias(dia, 1)) {
    dias.push(dia);
  }
  return dias;
}

// "09:30" no fuso da clínica a partir de um timestamp ISO.
export function formatarHoraBrasil(iso: string): string {
  return formatarHoraDeMinutos(minutosDoDiaBrasil(iso));
}
