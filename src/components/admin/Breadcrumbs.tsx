"use client";

import { usePathname } from "next/navigation";
import { Breadcrumbs as BreadcrumbsBase } from "@/components/ui/Breadcrumbs";
import { ITENS_NAVEGACAO_ADMIN } from "@/utils/navegacao";

function rotuloAtual(pathname: string): string {
  const item = ITENS_NAVEGACAO_ADMIN.find((i) => i.href === pathname);
  if (item) return item.label;

  const ultimoSegmento = pathname.split("/").filter(Boolean).pop() ?? "";
  return ultimoSegmento.charAt(0).toUpperCase() + ultimoSegmento.slice(1).replace(/-/g, " ");
}

export function Breadcrumbs() {
  const pathname = usePathname();
  if (pathname === "/admin") return null;

  return (
    <BreadcrumbsBase
      items={[{ label: "Dashboard", href: "/admin" }, { label: rotuloAtual(pathname) }]}
    />
  );
}
