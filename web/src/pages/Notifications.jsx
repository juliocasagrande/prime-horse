import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { subscribeToPush } from "../lib/push";
import "./pages.css";

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/notifications")
      .then(setNotifications)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Central de notificações</h1>
          <p>Histórico de alertas de estoque baixo já disparados para a equipe.</p>
        </div>
        <button className="btn btn-secondary" onClick={() => subscribeToPush()}>
          Ativar notificações push
        </button>
      </div>

      <div className="card table-card">
        {loading ? (
          <p className="empty-state">Carregando notificações...</p>
        ) : notifications.length === 0 ? (
          <p className="empty-state">Nenhum alerta disparado até agora.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Quando</th>
                <th>Item</th>
                <th>Mensagem</th>
              </tr>
            </thead>
            <tbody>
              {notifications.map((n) => (
                <tr key={n.id}>
                  <td>{new Date(n.created_at).toLocaleString("pt-BR")}</td>
                  <td>{n.item?.name || "—"}</td>
                  <td>{n.message}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
