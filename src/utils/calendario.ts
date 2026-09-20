import { dataHoraBrasil } from "@/utils/data";

const NOME_LOCAL = "Espaço Patrícia Fagundes";

type EventoAgendamento = {
  servicoNome: string;
  dataISO: string;
  horario: string;
  duracaoMinutos: number;
  observacoes?: string | null;
};

function formatarDataUTC(data: Date): string {
  return data.toISOString().replace(/[-:]|\.\d{3}/g, "");
}

function intervaloEvento({ dataISO, horario, duracaoMinutos }: EventoAgendamento) {
  const inicio = dataHoraBrasil(dataISO, horario);
  const fim = new Date(inicio.getTime() + duracaoMinutos * 60_000);
  return { inicio, fim };
}

export function gerarLinkGoogleAgenda(evento: EventoAgendamento): string {
  const { inicio, fim } = intervaloEvento(evento);

  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: `${evento.servicoNome} — ${NOME_LOCAL}`,
    dates: `${formatarDataUTC(inicio)}/${formatarDataUTC(fim)}`,
    details: evento.observacoes || "Agendamento confirmado pelo Agenda+.",
    location: NOME_LOCAL,
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

export function gerarConteudoICS(evento: EventoAgendamento): string {
  const { inicio, fim } = intervaloEvento(evento);
  const uid = `${inicio.getTime()}-${Math.random().toString(36).slice(2, 10)}@agendaplus`;

  const escapar = (texto: string) => texto.replace(/([,;])/g, "\\$1").replace(/\n/g, "\\n");

  const linhas = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Agenda+//Espaco Patricia Fagundes//PT-BR",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${formatarDataUTC(new Date())}`,
    `DTSTART:${formatarDataUTC(inicio)}`,
    `DTEND:${formatarDataUTC(fim)}`,
    `SUMMARY:${escapar(`${evento.servicoNome} — ${NOME_LOCAL}`)}`,
    `LOCATION:${escapar(NOME_LOCAL)}`,
    evento.observacoes ? `DESCRIPTION:${escapar(evento.observacoes)}` : null,
    "END:VEVENT",
    "END:VCALENDAR",
  ].filter((linha): linha is string => linha !== null);

  return linhas.join("\r\n");
}

export function baixarArquivoICS(evento: EventoAgendamento): void {
  const conteudo = gerarConteudoICS(evento);
  const blob = new Blob([conteudo], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = `agendamento-${evento.dataISO}-${evento.horario.replace(":", "")}.ics`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}