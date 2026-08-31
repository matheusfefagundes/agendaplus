import type { ButtonHTMLAttributes } from "react";
import { Loading } from "@/components/ui/Loading";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  size?: "default" | "sm";
  variant?: "primary" | "danger" | "secondary";
  loading?: boolean;
};

const SIZE_CLASSES: Record<NonNullable<ButtonProps["size"]>, string> = {
  default: "px-8 py-3.5 text-lg",
  sm: "px-5 py-2 text-sm",
};

const VARIANT_CLASSES: Record<NonNullable<ButtonProps["variant"]>, string> = {
  primary: "bg-brand text-white",
  danger: "bg-danger text-white",
  secondary: "bg-input text-brand",
};

const LOADING_BORDER_CLASSES: Record<NonNullable<ButtonProps["variant"]>, string> = {
  primary: "border-white/30 border-t-white",
  danger: "border-white/30 border-t-white",
  secondary: "border-brand/30 border-t-brand",
};

export function Button({
  className = "",
  size = "default",
  variant = "primary",
  loading = false,
  disabled,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      disabled={disabled || loading}
      className={`flex w-full items-center justify-center gap-2 rounded-full font-semibold shadow-[0px_12px_16px_rgba(26,28,25,0.06)] transition-opacity hover:opacity-90 disabled:opacity-60 ${VARIANT_CLASSES[variant]} ${SIZE_CLASSES[size]} ${className}`}
      {...props}
    >
      {loading && <Loading size="sm" className={LOADING_BORDER_CLASSES[variant]} />}
      {children}
    </button>
  );
}
