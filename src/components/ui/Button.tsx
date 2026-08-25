import type { ButtonHTMLAttributes } from "react";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  size?: "default" | "sm";
  variant?: "primary" | "danger" | "secondary";
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

export function Button({
  className = "",
  size = "default",
  variant = "primary",
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={`flex w-full items-center justify-center gap-2 rounded-full font-semibold shadow-[0px_12px_16px_rgba(26,28,25,0.06)] transition-opacity hover:opacity-90 disabled:opacity-60 ${VARIANT_CLASSES[variant]} ${SIZE_CLASSES[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
