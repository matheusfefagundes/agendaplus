import { dataLocalBrasil, formatarHoraDeMinutos, minutosDoDiaBrasil } from "@/utils/data";

const NOME_LOCAL = "Espaço Patrícia Fagundes";
const LIMITE_OCTETOS_LINHA = 75;
const codificador = new TextEncoder();

export type EventoCalendario = {
  id: string;
  servicoNome: string;
  dataHoraInicio: string;
  dataHoraFim: string;
  observacoes?: string | null;
};

function tituloEvento(evento: EventoCalendario): string {
  return `${evento.servicoNome} — ${NOME_LOCAL}`;
}

function formatarDataUTC(iso: string): string {
  return new Date(iso).toISOString().replace(/[-:]|\.\d{3}/g, "");
}

export function gerarLinkGoogleAgenda(evento: EventoCalendario): string {
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: tituloEvento(evento),
    dates: `${formatarDataUTC(evento.dataHoraInicio)}/${formatarDataUTC(evento.dataHoraFim)}`,
    details: evento.observacoes || "Agendamento confirmado pelo Agenda+.",
    location: NOME_LOCAL,
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

function escaparTexto(texto: string): string {
  return texto
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n");
}

function dobrarLinha(linha: string): string {
  if (codificador.encode(linha).length <= LIMITE_OCTETOS_LINHA) return linha;

  const partes: string[] = [];
  let atual = "";
  let octetos = 0;
  let limite = LIMITE_OCTETOS_LINHA;

  for (const caractere of linha) {
    const tamanho = codificador.encode(caractere).length;
    if (octetos + tamanho > limite) {
      partes.push(atual);
      atual = "";
      octetos = 0;
      limite = LIMITE_OCTETOS_LINHA - 1;
    }
    atual += caractere;
    octetos += tamanho;
  }
  partes.push(atual);

  return partes.join("\r\n ");
}

export function gerarConteudoICS(evento: EventoCalendario): string {
  const titulo = escaparTexto(tituloEvento(evento));

  const linhas = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Agenda+//Espaco Patricia Fagundes//PT-BR",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${evento.id}@agendaplus`,
    `DTSTAMP:${formatarDataUTC(new Date().toISOString())}`,
    `DTSTART:${formatarDataUTC(evento.dataHoraInicio)}`,
    `DTEND:${formatarDataUTC(evento.dataHoraFim)}`,
    "SEQUENCE:0",
    "STATUS:CONFIRMED",
    `SUMMARY:${titulo}`,
    `LOCATION:${escaparTexto(NOME_LOCAL)}`,
    evento.observacoes ? `DESCRIPTION:${escaparTexto(evento.observacoes)}` : null,
    "BEGIN:VALARM",
    "ACTION:DISPLAY",
    `DESCRIPTION:${titulo}`,
    "TRIGGER:-PT1H",
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ].filter((linha): linha is string => linha !== null);

  return linhas.map(dobrarLinha).join("\r\n") + "\r\n";
}

export function nomeArquivoICS(evento: EventoCalendario): string {
  const data = dataLocalBrasil(evento.dataHoraInicio);
  const hora = formatarHoraDeMinutos(minutosDoDiaBrasil(evento.dataHoraInicio)).replace(":", "");
  return `agendamento-${data}-${hora}.ics`;
}

export function urlCalendarioAgendamento(agendamentoId: string): string {
  return `/api/agendamentos/${agendamentoId}/calendario`;
}
