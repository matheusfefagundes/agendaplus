import { redirect } from "next/navigation";
import { obterSessao } from "@/lib/auth";
import { obterClientePorUsuarioId } from "@/services/cliente.service";
import { listarPacotesDoCliente } from "@/services/pacote-cliente.service";
import { MeusPacotesList } from "@/components/cliente/MeusPacotesList";

export default async function MeusPacotesPage() {
  const sessao = await obterSessao();
  if (!sessao) redirect("/login");

  const cliente = await obterClientePorUsuarioId(sessao.sub);
  if (!cliente) redirect("/login");

  const pacotes = await listarPacotesDoCliente(cliente.id);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold tracking-tight text-ink sm:text-4xl">Meus Pacotes</h1>
        <p className="text-lg text-ink-muted">Suas sessões disponíveis por serviço</p>
      </div>

      <MeusPacotesList pacotes={pacotes} />
    </div>
  );
}
