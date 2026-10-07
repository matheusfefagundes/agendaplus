import { obterSessao } from "@/lib/auth";
import { obterPerfil } from "@/services/perfil.service";
import { obterClientePorUsuarioId } from "@/services/cliente.service";
import { PerfilForm } from "@/components/cliente/PerfilForm";

export default async function ClienteConfiguracoesPage() {
  const sessao = await obterSessao();
  const [perfil, cliente] = sessao
    ? await Promise.all([obterPerfil(sessao.sub), obterClientePorUsuarioId(sessao.sub)])
    : [null, null];

  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">
        Configurações e Perfil
      </h1>

      <PerfilForm
        nome={perfil?.nome ?? ""}
        email={perfil?.email ?? ""}
        telefone={cliente?.telefone ?? ""}
      />
    </div>
  );
}
