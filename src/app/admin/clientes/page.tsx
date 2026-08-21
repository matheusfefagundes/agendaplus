import { ClientesManager } from "@/components/admin/ClientesManager";
import { listarClientes } from "@/services/cliente.service";

export default async function AdminClientesPage() {
  const clientes = await listarClientes();
  return <ClientesManager clientes={clientes} />;
}
