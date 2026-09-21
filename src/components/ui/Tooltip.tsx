"use client";

import { useId, useState, type ReactNode } from "react";

type TooltipProps = {
  content: ReactNode;
  children: ReactNode;
  side?: "top" | "bottom";
  align?: "center" | "end";
  className?: string;
};

const POSICAO_VERTICAL = { top: "bottom-full mb-2", bottom: "top-full mt-2" };
// "end" alinha o tooltip pela borda direita do alvo, para elementos encostados no canto direito
const POSICAO_HORIZONTAL = { center: "left-1/2 -translate-x-1/2", end: "right-0" };

export function Tooltip({ content, children, side = "top", align = "center", className = "" }: TooltipProps) {
  const [visivel, setVisivel] = useState(false);
  const id = useId();

  return (
    <span
      className={`relative inline-flex ${className}`}
      onMouseEnter={() => setVisivel(true)}
      onMouseLeave={() => setVisivel(false)}
      onFocus={() => setVisivel(true)}
      onBlur={() => setVisivel(false)}
    >
      <span aria-describedby={visivel ? id : undefined} className="inline-flex h-full w-full">
        {children}
      </span>
      {visivel && (
        <span
          id={id}
          role="tooltip"
          className={`pointer-events-none absolute z-50 w-max max-w-64 rounded-xl bg-ink px-3 py-1.5 text-center text-xs font-medium text-white shadow-lg ${POSICAO_VERTICAL[side]} ${POSICAO_HORIZONTAL[align]}`}
        >
          {content}
        </span>
      )}
    </span>
  );
}