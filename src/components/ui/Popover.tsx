"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

type PopoverRenderProps = {
  aberto: boolean;
  abrir: () => void;
  fechar: () => void;
  alternar: () => void;
};

type PopoverProps = {
  trigger: (props: PopoverRenderProps) => ReactNode;
  children: (props: { fechar: () => void }) => ReactNode;
  align?: "left" | "right";
  className?: string;
  panelClassName?: string;
};

// Popover genérico: cuida do estado aberto/fechado e do fechamento ao clicar
// fora, deixando o trigger e o conteúdo totalmente livres para o consumidor
export function Popover({ trigger, children, align = "left", className = "", panelClassName = "" }: PopoverProps) {
  const [aberto, setAberto] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!aberto) return;

    function aoClicarFora(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setAberto(false);
      }
    }
    document.addEventListener("mousedown", aoClicarFora);
    return () => document.removeEventListener("mousedown", aoClicarFora);
  }, [aberto]);

  const render: PopoverRenderProps = {
    aberto,
    abrir: () => setAberto(true),
    fechar: () => setAberto(false),
    alternar: () => setAberto((atual) => !atual),
  };

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {trigger(render)}
      {aberto && (
        <div
          className={`absolute top-full z-50 mt-2 rounded-3xl border border-input-border bg-cream shadow-lg ${
            align === "right" ? "right-0" : "left-0"
          } ${panelClassName}`}
        >
          {children({ fechar: render.fechar })}
        </div>
      )}
    </div>
  );
}
