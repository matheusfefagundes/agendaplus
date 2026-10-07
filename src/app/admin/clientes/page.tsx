import { ClientesManager } from "@/components/admin/ClientesManager";
import { listarClientes } from "@/services/cliente.service";
import { listarPacotes } from "@/services/pacote.service";
import { listarPacotesPorClientes } from "@/services/pacote-cliente.service";
import { listarServicos } from "@/services/servico.service";

export default async function AdminClientesPage() {
  const [clientes, servicos, pacotes, pacotesPorCliente] = await Promise.all([
    listarClientes(),
    listarServicos(),
    listarPacotes(),
    listarPacotesPorClientes(),
  ]);

  return (
    <ClientesManager
      clientes={clientes}
      servicos={servicos.filter((s) => s.ativo)}
      pacotes={pacotes.filter((p) => p.ativo)}
      pacotesPorCliente={pacotesPorCliente}
    />
  );
}
