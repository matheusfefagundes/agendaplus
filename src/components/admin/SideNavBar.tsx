"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { CalendarDays, LayoutDashboard, LogOut, Settings, Sparkles, Users } from "lucide-react";

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

  async function sair() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <aside className="flex h-screen w-64 shrink-0 flex-col justify-between border-r border-input-border bg-cream-dark px-4 py-6">
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
    </aside>
  );
}
