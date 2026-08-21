import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { obterSessao } from "@/lib/auth";
import { SideNavBar } from "@/components/admin/SideNavBar";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const sessao = await obterSessao();

  // Segunda camada de verificação além do middleware 
  if (!sessao || sessao.role !== "admin") {
    redirect("/login");
  }

  return (
    <div className="flex min-h-screen w-full flex-col bg-cream lg:h-screen lg:flex-row lg:overflow-hidden">
      <SideNavBar />
      <main className="flex-1 overflow-y-auto px-4 py-6 sm:px-6 lg:px-10 lg:py-8">{children}</main>
    </div>
  );
}
