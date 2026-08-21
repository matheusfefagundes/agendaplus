"use client";

import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";

type ConfirmModalProps = {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  confirming?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmModal({
  open,
  title,
  message,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  confirming = false,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  return (
    <Modal open={open} onClose={onCancel} title={title}>
      <p className="text-ink-muted">{message}</p>
      <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-full border border-input-border px-5 py-2 text-sm font-medium text-ink hover:bg-cream-dark"
        >
          {cancelLabel}
        </button>
        <Button
          type="button"
          variant="danger"
          size="sm"
          disabled={confirming}
          onClick={onConfirm}
          className="sm:w-auto"
        >
          {confirming ? "Excluindo..." : confirmLabel}
        </Button>
      </div>
    </Modal>
  );
}
