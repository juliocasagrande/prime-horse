import { useCallback, useEffect, useState } from "react";
import { api } from "../lib/api";
import { subscribeToPush } from "../lib/push";
import { Toast } from "../components/Toast";
import { Icon } from "../components/Icons";
import "./pages.css";

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [pushActive, setPushActive] = useState(false);
  const [toast, setToast] = useState("");
  const closeToast = useCallback(() => setToast(""), []);

  useEffect(() => {
    api.get("/notifications").then(setNotifications).catch((err) => setError(err.message)).finally(() => setLoading(false));
  }, []);

  async function enablePush() {
    const result = await subscribeToPush();
    if (result.ok) {
      setPushActive(true); setToast("Notificações push ativadas com sucesso.");
    } else {
      const messages = {
        denied: "Permissão de notificações negada no navegador.",
        unsupported: "Este navegador não suporta notificações push.",
        "not-configured": "As notificações push não estão configuradas no servidor.",
      };
      setError(messages[result.reason] || "Não foi possível ativar as notificações.");
    }
  }

  return (
    <div className="page">
      <div className="page-header">
        <div className="page-header-copy"><h1>Central de notificações</h1><p>Acompanhe alertas de estoque baixo e saldo negativo gerados automaticamente.</p></div>
        <div className="page-header-actions">
          <button className={"btn " + (pushActive ? "" : "btn-secondary")} onClick={enablePush}><Icon name={pushActive ? "check" : "bell"} size={17} />{pushActive ? "Notificações ativadas" : "Ativar notificações push"}</button>
        </div>
      </div>
      {error && <p className="negative-note"><Icon name="alert" size={17} />{error}</p>}
      {loading ? <div className="card"><p className="empty-state">Carregando notificações...</p></div> : !notifications.length ? (
        <div className="card empty-state"><span className="empty-state-icon"><Icon name="bell" size={20} /></span>Nenhum alerta disparado até agora.</div>
      ) : (
        <div className="notification-list">
          {notifications.map((notification) => (
            <article className="card notification-row" key={notification.id}>
              <span className="notification-icon"><Icon name="bell" size={18} /></span>
              <div><p className="notification-message">{notification.message}</p><span className="notification-meta">{notification.item?.name || "Estoque geral"}</span></div>
              <time className="notification-meta">{new Date(notification.created_at).toLocaleString("pt-BR")}</time>
            </article>
          ))}
        </div>
      )}
      {toast && <Toast message={toast} onClose={closeToast} />}
    </div>
  );
}
