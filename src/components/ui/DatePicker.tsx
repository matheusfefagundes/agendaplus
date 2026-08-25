"use client";

import { useEffect, useRef, useState, type ChangeEvent, type KeyboardEvent } from "react";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";

const DIAS_ABREV = ["D", "S", "T", "Q", "Q", "S", "S"];
const MESES = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

type DatePickerProps = {
  id?: string;
  label?: string;
  value: string;
  onChange: (valor: string) => void;
  min?: string;
};

function paraPartes(iso: string): { ano: number; mes: number; dia: number } {
  const [ano, mes, dia] = iso.split("-").map(Number);
  return { ano, mes, dia };
}

function paraISO(ano: number, mes: number, dia: number): string {
  return `${ano}-${String(mes).padStart(2, "0")}-${String(dia).padStart(2, "0")}`;
}

function formatarExibicao(iso: string): string {
  const { ano, mes, dia } = paraPartes(iso);
  return `${String(dia).padStart(2, "0")}/${String(mes).padStart(2, "0")}/${ano}`;
}

function diasDoMes(ano: number, mes: number): number {
  return new Date(Date.UTC(ano, mes, 0)).getUTCDate();
}

function primeiroDiaSemana(ano: number, mes: number): number {
  return new Date(Date.UTC(ano, mes - 1, 1)).getUTCDay();
}

function mascararData(valor: string): string {
  const digitos = valor.replace(/\D/g, "").slice(0, 8);
  if (digitos.length <= 2) return digitos;
  if (digitos.length <= 4) return `${digitos.slice(0, 2)}/${digitos.slice(2)}`;
  return `${digitos.slice(0, 2)}/${digitos.slice(2, 4)}/${digitos.slice(4)}`;
}

function paraISODeDigitado(texto: string): string | null {
  const match = texto.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!match) return null;
  const dia = Number(match[1]);
  const mes = Number(match[2]);
  const ano = Number(match[3]);
  if (mes < 1 || mes > 12) return null;
  if (dia < 1 || dia > diasDoMes(ano, mes)) return null;
  return paraISO(ano, mes, dia);
}

export function DatePicker({ id, label, value, onChange, min }: DatePickerProps) {
  const [aberto, setAberto] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const hoje = new Date();
  const hojeISO = paraISO(hoje.getFullYear(), hoje.getMonth() + 1, hoje.getDate());
  const base = paraPartes(value || min || hojeISO);
  const [mesVisivel, setMesVisivel] = useState({ ano: base.ano, mes: base.mes });
  const [texto, setTexto] = useState(value ? formatarExibicao(value) : "");

  const [valorAnterior, setValorAnterior] = useState(value);
  if (value !== valorAnterior) {
    setValorAnterior(value);
    const partes = paraPartes(value || min || hojeISO);
    setMesVisivel({ ano: partes.ano, mes: partes.mes });
    setTexto(value ? formatarExibicao(value) : "");
  }

  useEffect(() => {
    function aoClicarFora(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setAberto(false);
      }
    }
    document.addEventListener("mousedown", aoClicarFora);
    return () => document.removeEventListener("mousedown", aoClicarFora);
  }, []);

  const totalDias = diasDoMes(mesVisivel.ano, mesVisivel.mes);
  const offset = primeiroDiaSemana(mesVisivel.ano, mesVisivel.mes);
  const celulas: (number | null)[] = [
    ...Array<null>(offset).fill(null),
    ...Array.from({ length: totalDias }, (_, i) => i + 1),
  ];

  function mudarMes(delta: number) {
    setMesVisivel((atual) => {
      let mes = atual.mes + delta;
      let ano = atual.ano;
      if (mes < 1) {
        mes = 12;
        ano -= 1;
      } else if (mes > 12) {
        mes = 1;
        ano += 1;
      }
      return { ano, mes };
    });
  }

  function selecionar(dia: number) {
    const iso = paraISO(mesVisivel.ano, mesVisivel.mes, dia);
    if (min && iso < min) return;
    onChange(iso);
    setAberto(false);
  }

  function aoDigitar(event: ChangeEvent<HTMLInputElement>) {
    const mascarado = mascararData(event.target.value);
    setTexto(mascarado);

    const iso = paraISODeDigitado(mascarado);
    if (iso && (!min || iso >= min)) {
      onChange(iso);
      setMesVisivel({ ano: paraPartes(iso).ano, mes: paraPartes(iso).mes });
    }
  }

  function aoSairDoCampo() {
    const iso = paraISODeDigitado(texto);
    if (!iso || (min && iso < min)) {
      setTexto(value ? formatarExibicao(value) : "");
    }
  }

  function aoPressionarTecla(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter") event.preventDefault();
  }

  return (
    <div className="relative flex flex-col gap-1.5" ref={containerRef}>
      {label && (
        <label htmlFor={id} className="text-sm text-ink">
          {label}
        </label>
      )}
      <div className="relative flex w-full items-center">
        <input
          id={id}
          type="text"
          inputMode="numeric"
          placeholder="dd/mm/aaaa"
          value={texto}
          onChange={aoDigitar}
          onFocus={() => setAberto(true)}
          onBlur={aoSairDoCampo}
          onKeyDown={aoPressionarTecla}
          className="w-full rounded-3xl border border-input-border bg-input px-4 py-3 pr-11 text-ink placeholder:text-ink-muted"
        />
        <button
          type="button"
          onClick={() => setAberto((atual) => !atual)}
          aria-label="Abrir calendário"
          className="absolute right-3 text-ink-muted hover:text-ink"
        >
          <CalendarDays size={18} />
        </button>
      </div>

      {aberto && (
        <div className="absolute top-full z-50 mt-2 w-72 rounded-3xl border border-input-border bg-cream p-4 shadow-lg">
          <div className="flex items-center justify-between pb-3">
            <button
              type="button"
              onClick={() => mudarMes(-1)}
              aria-label="Mês anterior"
              className="rounded-full p-1.5 text-ink hover:bg-input"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="text-sm font-semibold text-ink">
              {MESES[mesVisivel.mes - 1]} {mesVisivel.ano}
            </span>
            <button
              type="button"
              onClick={() => mudarMes(1)}
              aria-label="Próximo mês"
              className="rounded-full p-1.5 text-ink hover:bg-input"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center text-xs text-ink-muted">
            {DIAS_ABREV.map((dia, i) => (
              <span key={i}>{dia}</span>
            ))}
          </div>

          <div className="mt-1 grid grid-cols-7 gap-1">
            {celulas.map((dia, i) => {
              if (dia === null) return <span key={`vazio-${i}`} />;
              const iso = paraISO(mesVisivel.ano, mesVisivel.mes, dia);
              const desabilitado = Boolean(min && iso < min);
              const estaSelecionado = iso === value;
              const ehHoje = iso === hojeISO;

              return (
                <button
                  key={iso}
                  type="button"
                  disabled={desabilitado}
                  onClick={() => selecionar(dia)}
                  className={`aspect-square rounded-full text-sm transition-colors ${
                    estaSelecionado
                      ? "bg-brand font-semibold text-white"
                      : ehHoje
                        ? "border border-brand text-brand"
                        : desabilitado
                          ? "cursor-not-allowed text-ink-muted/40"
                          : "text-ink hover:bg-input"
                  }`}
                >
                  {dia}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
