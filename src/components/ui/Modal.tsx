"use client";

import { X } from "lucide-react";
import type { ReactNode } from "react";
import { useTravarScroll } from "@/hooks/useTravarScroll";

type ModalProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: "default" | "lg";
};

const SIZE_CLASSES: Record<NonNullable<ModalProps["size"]>, string> = {
  default: "sm:max-w-lg",
  lg: "sm:max-w-2xl",
};

export function Modal({ open, onClose, title, children, footer, size = "default" }: ModalProps) {
  useTravarScroll(open);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center sm:px-4">
      <div
        className={`flex max-h-[90dvh] w-full flex-col rounded-t-3xl bg-cream shadow-xl sm:rounded-3xl ${SIZE_CLASSES[size]}`}
      >
        <div className="flex shrink-0 items-center justify-between p-6 pb-4">
          <h2 className="text-lg font-bold text-ink">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="p-1 text-ink-muted hover:text-ink"
          >
            <X size={20} />
          </button>
        </div>

        {/* Só o meio rola — cabeçalho e rodapé (quando houver) ficam fixos.
            A barra de rolagem é estilizada pra ficar visível, no lugar da
            padrão do navegador. */}
        <div
          className={`flex-1 overflow-y-auto px-6 [scrollbar-width:thin] [scrollbar-color:var(--color-ink-muted)_transparent] [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-ink-muted/40 [&::-webkit-scrollbar-track]:bg-transparent ${
            footer ? "pb-4" : "pb-6"
          }`}
        >
          {children}
        </div>

        {footer && <div className="shrink-0 border-t border-input-border p-6 pt-4">{footer}</div>}
      </div>
    </div>
  );
}
