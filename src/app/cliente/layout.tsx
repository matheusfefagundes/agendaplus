import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { obterSessao } from "@/lib/auth";
import { obterClientePorUsuarioId } from "@/services/cliente.service";
import { SideNavBar } from "@/components/cliente/SideNavBar";

export default async function ClienteLayout({ children }: { children: ReactNode }) {
  const sessao = await obterSessao();

  // Segunda camada de verificação além do proxy
  if (!sessao || sessao.role !== "cliente") {
    redirect("/login");
  }

  const cliente = await obterClientePorUsuarioId(sessao.sub);
  if (!cliente) {
    redirect("/login");
  }

  return (
    <div className="flex min-h-screen w-full flex-col bg-cream lg:h-screen lg:flex-row lg:overflow-hidden">
      <SideNavBar nomeCliente={cliente.nome} />
      <main className="flex-1 overflow-y-auto px-4 py-6 sm:px-6 lg:px-10 lg:py-8">{children}</main>
    </div>
  );
}
