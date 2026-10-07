"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";

export type ItemBreadcrumb = {
  label: string;
  href?: string;
};

type BreadcrumbsProps = {
  items: ItemBreadcrumb[];
};

// Some nas telas raiz (Dashboard/Início), onde não há hierarquia a mostrar
export function Breadcrumbs({ items }: BreadcrumbsProps) {
  if (items.length < 2) return null;

  return (
    <nav
      aria-label="Trilha de navegação"
      className="mb-4 flex items-center gap-1.5 overflow-x-auto whitespace-nowrap text-sm"
    >
      {items.map((item, index) => {
        const ultimo = index === items.length - 1;
        return (
          <span key={item.href ?? item.label} className="flex items-center gap-1.5">
            {index > 0 && (
              <ChevronRight size={14} className="shrink-0 text-ink-muted" aria-hidden="true" />
            )}
            {ultimo || !item.href ? (
              <span
                className={ultimo ? "font-semibold text-ink" : "text-ink-muted"}
                aria-current={ultimo ? "page" : undefined}
              >
                {item.label}
              </span>
            ) : (
              <Link href={item.href} className="text-ink-muted transition-colors hover:text-ink">
                {item.label}
              </Link>
            )}
          </span>
        );
      })}
    </nav>
  );
}
