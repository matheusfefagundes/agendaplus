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
    <div className="flex h-screen w-full overflow-hidden bg-cream">
      <SideNavBar />
      <main className="flex-1 overflow-y-auto px-10 py-8">{children}</main>
    </div>
  );
}
