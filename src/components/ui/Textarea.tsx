import type { TextareaHTMLAttributes } from "react";

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label: string;
  error?: boolean;
  errorMessage?: string;
};

export function Textarea({
  label,
  error = false,
  errorMessage,
  id,
  className = "",
  ...props
}: TextareaProps) {
  return (
    <div className="flex w-full flex-col items-end gap-1.5">
      <label htmlFor={id} className="w-full text-sm text-ink">
        {label}
      </label>
      <textarea
        id={id}
        aria-invalid={error || undefined}
        className={`w-full rounded-3xl border px-4 py-[14px] text-base placeholder:text-ink-muted focus:outline-2 ${
          error
            ? "border-danger bg-danger-bg text-danger focus:outline-danger"
            : "border-input-border bg-input text-ink focus:outline-brand"
        } ${className}`}
        {...props}
      />
      {error && errorMessage && <p className="w-full text-sm text-danger">{errorMessage}</p>}
    </div>
  );
}
