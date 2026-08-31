type LoadingProps = {
  size?: "sm" | "default" | "lg";
  label?: string;
  className?: string;
};

const TAMANHO_CLASSES: Record<NonNullable<LoadingProps["size"]>, string> = {
  sm: "size-4 border-2",
  default: "size-6 border-2",
  lg: "size-10 border-[3px]",
};

export function Loading({ size = "default", label = "Carregando", className = "" }: LoadingProps) {
  return (
    <span
      role="status"
      aria-label={label}
      className={`inline-block shrink-0 animate-spin rounded-full border-input-border border-t-brand ${TAMANHO_CLASSES[size]} ${className}`}
    />
  );
}
