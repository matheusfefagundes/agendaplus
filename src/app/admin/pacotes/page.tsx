import { PacotesManager } from "@/components/admin/PacotesManager";
import { listarPacotes } from "@/services/pacote.service";
import { listarServicos } from "@/services/servico.service";

export default async function AdminPacotesPage() {
  const [pacotes, servicos] = await Promise.all([listarPacotes(), listarServicos()]);
  return <PacotesManager pacotes={pacotes} servicos={servicos.filter((s) => s.ativo)} />;
}
