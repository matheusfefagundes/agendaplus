import { obterSessao } from "@/lib/auth";
import { obterPerfil } from "@/services/perfil.service";
import { listarHorarios } from "@/services/horario.service";
import { PerfilForm } from "@/components/admin/PerfilForm";
import { HorariosEditor } from "@/components/admin/HorariosEditor";

export default async function AdminConfiguracoesPage() {
  const sessao = await obterSessao();
  const [perfil, horarios] = await Promise.all([
    sessao ? obterPerfil(sessao.sub) : null,
    listarHorarios(),
  ]);

  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">
        Configurações e Perfil
      </h1>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[2fr_1fr]">
        <PerfilForm nome={perfil?.nome ?? ""} email={perfil?.email ?? ""} />
        <HorariosEditor horarios={horarios} />
      </div>
    </div>
  );
}
