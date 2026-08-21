import { ServicosManager } from "@/components/admin/ServicosManager";
import { listarServicos } from "@/services/servico.service";

export default async function AdminServicosPage() {
  const servicos = await listarServicos();
  return <ServicosManager servicos={servicos} />;
}
