"use client";

import { useId, useState, type ReactNode } from "react";

type TooltipProps = {
  content: ReactNode;
  children: ReactNode;
  side?: "top" | "bottom";
  className?: string;
};

export function Tooltip({ content, children, side = "top", className = "" }: TooltipProps) {
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
          className={`pointer-events-none absolute z-50 w-max max-w-64 rounded-xl bg-ink px-3 py-1.5 text-center text-xs font-medium text-white shadow-lg ${
            side === "top"
              ? "bottom-full left-1/2 mb-2 -translate-x-1/2"
              : "top-full left-1/2 mt-2 -translate-x-1/2"
          }`}
        >
          {content}
        </span>
      )}
    </span>
  );
}