import { Suspense } from "react";
import { obterSessao } from "@/lib/auth";
import { obterPerfil } from "@/services/perfil.service";
import { listarHorarios } from "@/services/horario.service";
import { obterIntegracaoGoogleAgenda } from "@/services/google-agenda.service";
import { PerfilForm } from "@/components/admin/PerfilForm";
import { HorariosEditor } from "@/components/admin/HorariosEditor";
import { GoogleAgendaCard } from "@/components/admin/GoogleAgendaCard";

export default async function AdminConfiguracoesPage() {
  const sessao = await obterSessao();
  const [perfil, horarios, integracaoGoogle] = await Promise.all([
    sessao ? obterPerfil(sessao.sub) : null,
    listarHorarios(),
    obterIntegracaoGoogleAgenda(),
  ]);

  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">
        Configurações e Perfil
      </h1>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[2fr_1fr]">
        <div className="flex flex-col gap-6">
          <PerfilForm
            nome={perfil?.nome ?? ""}
            email={perfil?.email ?? ""}
            temSenha={perfil?.temSenha ?? true}
          />
          <Suspense fallback={null}>
            <GoogleAgendaCard integracao={integracaoGoogle} />
          </Suspense>
        </div>
        <div className="lg:relative">
          <div className="lg:absolute lg:inset-0">
            <HorariosEditor horarios={horarios} />
          </div>
        </div>
      </div>
    </div>
  );
}
