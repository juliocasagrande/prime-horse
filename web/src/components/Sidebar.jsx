import { NavLink } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { Brand } from "./Brand";
import { Icon } from "./Icons";

const ALL_ITEMS = [
  { to: "/", label: "Painel geral", icon: "dashboard", end: true, roles: ["admin", "operador", "financeiro"] },
  { to: "/itens", label: "Itens de estoque", icon: "box", roles: ["admin", "operador", "financeiro"] },
  { to: "/movimentacoes", label: "Entrada & Saída", icon: "movements", roles: ["admin", "operador", "financeiro"] },
  { to: "/notificacoes", label: "Central de notificações", shortLabel: "Notificações", icon: "bell", roles: ["admin", "operador", "financeiro"] },
  { to: "/usuarios", label: "Usuários", icon: "users", roles: ["admin"] },
  { to: "/configuracoes", label: "Configurações", icon: "settings", roles: ["admin"] },
];

export function Sidebar() {
  const { profile } = useAuth();
  const items = ALL_ITEMS.filter((item) => item.roles.includes(profile?.role));

  function NavItems({ mobile = false }) {
    return items.map((item) => (
      <NavLink
        key={item.to}
        to={item.to}
        end={item.end}
        aria-label={mobile ? item.shortLabel || item.label : undefined}
        title={mobile ? item.label : undefined}
        className={({ isActive }) => `${mobile ? "bottom-nav-link" : "sidebar-link"}${isActive ? " active" : ""}`}
      >
        <Icon name={item.icon} size={mobile ? 21 : 18} />
        {!mobile && <span>{item.label}</span>}
      </NavLink>
    ));
  }

  return (
    <>
      <aside className="sidebar">
        <div className="sidebar-brand"><Brand compact inverse /></div>
        <nav className="sidebar-nav" aria-label="Navegação principal"><NavItems /></nav>
      </aside>
      <nav className="bottom-nav" aria-label="Navegação principal mobile"><NavItems mobile /></nav>
    </>
  );
}
