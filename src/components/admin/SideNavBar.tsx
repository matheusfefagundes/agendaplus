"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import {
  CalendarDays,
  LayoutDashboard,
  LogOut,
  Menu,
  Settings,
  Sparkles,
  Users,
  X,
} from "lucide-react";

const ITENS_NAVEGACAO = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/agenda", label: "Agenda", icon: CalendarDays },
  { href: "/admin/servicos", label: "Serviços", icon: Sparkles },
  { href: "/admin/clientes", label: "Clientes", icon: Users },
  { href: "/admin/configuracoes", label: "Configurações", icon: Settings },
];

export function SideNavBar() {
  const pathname = usePathname();
  const router = useRouter();
  const [menuAberto, setMenuAberto] = useState(false);

  async function sair() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  const conteudoNav = (
    <>
      <div className="flex flex-col gap-8">
        <div className="flex items-center gap-3 px-2">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-cream drop-shadow-[0px_1px_1px_rgba(0,0,0,0.05)]">
            <Image src="/icons/logo-leaf.svg" alt="" width={17} height={17} />
          </div>
          <span className="text-xl font-extrabold tracking-tight text-brand">Agenda+</span>
        </div>

        <nav className="flex flex-col gap-1">
          {ITENS_NAVEGACAO.map(({ href, label, icon: Icon }) => {
            const ativo = href === "/admin" ? pathname === href : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setMenuAberto(false)}
                className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition-colors ${
                  ativo ? "bg-brand text-white" : "text-ink hover:bg-cream"
                }`}
              >
                <Icon size={18} />
                {label}
              </Link>
            );
          })}
        </nav>
      </div>

      <button
        type="button"
        onClick={sair}
        className="flex items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-medium text-ink-muted transition-colors hover:bg-cream hover:text-danger"
      >
        <LogOut size={18} />
        Sair
      </button>
    </>
  );

  return (
    <>
      {/* Barra superior — só em telas pequenas */}
      <header className="flex items-center justify-between border-b border-input-border bg-cream-dark px-4 py-3 lg:hidden">
        <div className="flex items-center gap-2">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-cream">
            <Image src="/icons/logo-leaf.svg" alt="" width={15} height={15} />
          </div>
          <span className="text-lg font-extrabold tracking-tight text-brand">Agenda+</span>
        </div>
        <button
          type="button"
          onClick={() => setMenuAberto(true)}
          aria-label="Abrir menu"
          className="p-1 text-ink"
        >
          <Menu size={24} />
        </button>
      </header>

      {/* Menu em drawer — só em telas pequenas */}
      {menuAberto && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setMenuAberto(false)}
            aria-hidden="true"
          />
          <aside className="relative flex h-full w-72 max-w-[80vw] flex-col justify-between bg-cream-dark px-4 py-6">
            <button
              type="button"
              onClick={() => setMenuAberto(false)}
              aria-label="Fechar menu"
              className="absolute right-4 top-4 p-1 text-ink-muted"
            >
              <X size={22} />
            </button>
            {conteudoNav}
          </aside>
        </div>
      )}

      {/* Sidebar fixa — só em telas grandes */}
      <aside className="hidden h-screen w-64 shrink-0 flex-col justify-between border-r border-input-border bg-cream-dark px-4 py-6 lg:flex">
        {conteudoNav}
      </aside>
    </>
  );
}
