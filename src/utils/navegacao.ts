import type { LucideIcon } from "lucide-react";
import {
  CalendarDays,
  CalendarPlus,
  History,
  Home,
  LayoutDashboard,
  Package,
  Settings,
  Sparkles,
  Users,
} from "lucide-react";

export type ItemNavegacao = {
  href: string;
  label: string;
  icon: LucideIcon;
};

export const ITENS_NAVEGACAO_ADMIN: ItemNavegacao[] = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/agenda", label: "Agenda", icon: CalendarDays },
  { href: "/admin/servicos", label: "Serviços", icon: Sparkles },
  { href: "/admin/pacotes", label: "Pacotes", icon: Package },
  { href: "/admin/clientes", label: "Clientes", icon: Users },
  { href: "/admin/configuracoes", label: "Configurações", icon: Settings },
];

export const ITENS_NAVEGACAO_CLIENTE: ItemNavegacao[] = [
  { href: "/cliente", label: "Início", icon: Home },
  { href: "/cliente/meus-agendamentos", label: "Meus Agendamentos", icon: CalendarDays },
  { href: "/cliente/novo-agendamento", label: "Novo Agendamento", icon: CalendarPlus },
  { href: "/cliente/pacotes", label: "Meus Pacotes", icon: Package },
  { href: "/cliente/historico", label: "Histórico", icon: History },
];
