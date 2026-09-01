import { Outlet } from "react-router-dom";
import { Sidebar } from "../components/Sidebar";
import { ConnectionIndicator } from "../components/ConnectionIndicator";
import { Icon } from "../components/Icons";
import { useAuth } from "../contexts/AuthContext";
import "./AppLayout.css";

const ROLE_LABEL = { admin: "Administrador", operador: "Operador de campo", financeiro: "Financeiro" };

export function AppLayout() {
  const { profile, signOut } = useAuth();
  return (
    <div className="app-shell">
      <Sidebar />
      <div className="app-main">
        <header className="app-topbar">
          <ConnectionIndicator />
          <div className="app-topbar-user">
            <span className="app-topbar-name">{profile?.name}</span>
            <span className="badge badge-role">{ROLE_LABEL[profile?.role] || profile?.role}</span>
            <button className="btn btn-secondary btn-compact" onClick={signOut}><Icon name="logout" size={16} /> Sair</button>
          </div>
        </header>
        <main className="app-content"><Outlet /></main>
      </div>
    </div>
  );
}
