"use client";

import { usePathname } from "next/navigation";
import { Breadcrumbs as BreadcrumbsBase } from "@/components/ui/Breadcrumbs";
import { ITENS_NAVEGACAO_CLIENTE } from "@/utils/navegacao";

// Rótulos que não vêm do menu lateral (ex: link de perfil, fora do array de navegação)
const ROTULOS_EXTRA: Record<string, string> = {
  "/cliente/configuracoes": "Configurações",
};

function rotuloAtual(pathname: string): string {
  const item = ITENS_NAVEGACAO_CLIENTE.find((i) => i.href === pathname);
  if (item) return item.label;
  if (ROTULOS_EXTRA[pathname]) return ROTULOS_EXTRA[pathname];

  const ultimoSegmento = pathname.split("/").filter(Boolean).pop() ?? "";
  return ultimoSegmento.charAt(0).toUpperCase() + ultimoSegmento.slice(1).replace(/-/g, " ");
}

export function Breadcrumbs() {
  const pathname = usePathname();
  if (pathname === "/cliente") return null;

  return (
    <BreadcrumbsBase
      items={[{ label: "Início", href: "/cliente" }, { label: rotuloAtual(pathname) }]}
    />
  );
}
