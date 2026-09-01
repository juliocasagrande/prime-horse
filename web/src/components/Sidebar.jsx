import { NavLink } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

const ALL_ITEMS = [
  { to: "/", label: "Painel geral", end: true, roles: ["admin", "operador", "financeiro"] },
  { to: "/itens", label: "Itens de estoque", roles: ["admin", "operador", "financeiro"] },
  { to: "/movimentacoes", label: "Entrada & Saída", roles: ["admin", "operador", "financeiro"] },
  { to: "/notificacoes", label: "Central de notificações", roles: ["admin", "operador", "financeiro"] },
  { to: "/usuarios", label: "Usuários", roles: ["admin"] },
  { to: "/configuracoes", label: "Configurações", roles: ["admin"] },
];

export function Sidebar() {
  const { profile } = useAuth();
  const role = profile?.role;

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <span className="sidebar-brand-title">Prime Horse</span>
        <span className="sidebar-brand-subtitle">Gestão Empresarial</span>
      </div>
      <nav className="sidebar-nav">
        {ALL_ITEMS.filter((item) => item.roles.includes(role)).map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) => "sidebar-link" + (isActive ? " active" : "")}
          >
            {item.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
