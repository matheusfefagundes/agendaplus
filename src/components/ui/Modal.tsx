"use client";

import { X } from "lucide-react";
import type { ReactNode } from "react";

type ModalProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  size?: "default" | "lg";
};

const SIZE_CLASSES: Record<NonNullable<ModalProps["size"]>, string> = {
  default: "sm:max-w-lg",
  lg: "sm:max-w-2xl",
};

export function Modal({ open, onClose, title, children, size = "default" }: ModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center sm:px-4">
      <div
        className={`max-h-[90vh] w-full overflow-y-auto rounded-t-3xl bg-cream p-6 shadow-xl sm:rounded-3xl ${SIZE_CLASSES[size]}`}
      >
        <div className="mb-4 flex items-center justify-between">
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
        {children}
      </div>
    </div>
  );
}
