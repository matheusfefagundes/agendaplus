import type { ButtonHTMLAttributes } from "react";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement>;

export function Button({ className = "", children, ...props }: ButtonProps) {
  return (
    <button
      className={`flex w-full items-center justify-center gap-2 rounded-full bg-brand px-8 py-3.5 text-lg font-semibold text-white shadow-[0px_12px_16px_rgba(26,28,25,0.06)] transition-opacity hover:opacity-90 disabled:opacity-60 ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
