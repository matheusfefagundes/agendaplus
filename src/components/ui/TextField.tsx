import { TriangleAlert } from "lucide-react";
import type { InputHTMLAttributes, ReactNode } from "react";

type TextFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  icon?: ReactNode;
  rightSlot?: ReactNode;
  labelAction?: ReactNode;
  error?: boolean;
  errorMessage?: string;
};

export function TextField({
  label,
  icon,
  rightSlot,
  labelAction,
  error = false,
  errorMessage,
  id,
  className = "",
  ...props
}: TextFieldProps) {
  const rightIconCount = (error ? 1 : 0) + (rightSlot ? 1 : 0);

  return (
    <div className="flex w-full flex-col items-end gap-1.5">
      <div className="flex w-full items-center justify-between">
        <label htmlFor={id} className="text-sm text-ink">
          {label}
        </label>
        {labelAction}
      </div>
      <div className="relative w-full">
        {icon && (
          <span
            className={`pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 ${error ? "text-danger" : "text-ink-muted"}`}
          >
            {icon}
          </span>
        )}
        <input
          id={id}
          aria-invalid={error || undefined}
          className={`w-full rounded-3xl border py-[14px] pr-4 text-base placeholder:text-ink-muted focus:outline-2 ${
            error
              ? "border-danger bg-danger-bg text-danger focus:outline-danger"
              : "border-input-border bg-input text-ink focus:outline-brand"
          } ${icon ? "pl-11" : "pl-4"} ${
            rightIconCount === 2 ? "pr-20" : rightIconCount === 1 ? "pr-11" : ""
          } ${className}`}
          {...props}
        />
        {(error || rightSlot) && (
          <span className="absolute right-4 top-1/2 flex -translate-y-1/2 items-center gap-2">
            {error && (
              <TriangleAlert size={18} className="text-danger" aria-hidden="true" />
            )}
            {rightSlot}
          </span>
        )}
      </div>
      {error && errorMessage && <p className="text-sm text-danger">{errorMessage}</p>}
    </div>
  );
}
