import { ClientesManager } from "@/components/admin/ClientesManager";
import { listarClientes } from "@/services/cliente.service";
import { listarServicos } from "@/services/servico.service";

export default async function AdminClientesPage() {
  const [clientes, servicos] = await Promise.all([listarClientes(), listarServicos()]);
  return <ClientesManager clientes={clientes} servicos={servicos.filter((s) => s.ativo)} />;
}
