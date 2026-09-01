import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { subscribeToPush } from "../lib/push";
import "./pages.css";

export default function Dashboard() {
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState("");
  const [pushStatus, setPushStatus] = useState(null);

  useEffect(() => {
    api
      .get("/dashboard/summary")
      .then(setSummary)
      .catch((err) => setError(err.message));
  }, []);

  async function handleEnablePush() {
    const result = await subscribeToPush();
    setPushStatus(result);
  }

  if (error) return <p className="empty-state">{error}</p>;
  if (!summary) return <p className="empty-state">Carregando painel...</p>;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Painel geral</h1>
          <p>Visão resumida do estoque da Prime Horse.</p>
        </div>
        <button className="btn btn-secondary" onClick={handleEnablePush}>
          Ativar notificações push
        </button>
      </div>

      {pushStatus && !pushStatus.ok && (
        <p className="negative-note">
          {pushStatus.reason === "denied" &&
            "Permissão de notificação negada. Ative nas configurações do navegador."}
          {pushStatus.reason === "unsupported" && "Este navegador não suporta notificações push."}
          {pushStatus.reason === "not-configured" && "Notificações push não configuradas no servidor."}
        </p>
      )}

      <div className="grid-cards">
        <div className="card stat-card">
          <div className="stat-value">{summary.totalItems}</div>
          <div className="stat-label">Itens cadastrados</div>
        </div>
        <div className="card stat-card">
          <div className="stat-value">{summary.activeUsers}</div>
          <div className="stat-label">Usuários ativos</div>
        </div>
        <div className={`card stat-card ${summary.lowStockCount > 0 ? "alert" : ""}`}>
          <div className="stat-value">{summary.lowStockCount}</div>
          <div className="stat-label">Itens em atenção (estoque baixo)</div>
        </div>
        <div className={`card stat-card ${summary.negativeCount > 0 ? "alert" : ""}`}>
          <div className="stat-value">{summary.negativeCount}</div>
          <div className="stat-label">Itens com saldo negativo</div>
        </div>
      </div>

      <div className="two-col">
        <div className="card table-card">
          <div style={{ padding: "1rem 1.2rem 0" }}>
            <h3>Últimas movimentações</h3>
          </div>
          {summary.recentMovements.length === 0 ? (
            <p className="empty-state">Nenhuma movimentação registrada ainda.</p>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Tipo</th>
                  <th>Qtd.</th>
                  <th>Quando</th>
                </tr>
              </thead>
              <tbody>
                {summary.recentMovements.map((m) => (
                  <tr key={m.id}>
                    <td>{m.item?.name}</td>
                    <td>{m.type === "entrada" ? "Entrada" : "Saída"}</td>
                    <td>
                      {m.quantity} {m.item?.unit}
                    </td>
                    <td>{new Date(m.occurred_at).toLocaleString("pt-BR")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="card table-card">
          <div style={{ padding: "1rem 1.2rem 0" }}>
            <h3>Itens em estoque baixo</h3>
          </div>
          {summary.lowStockItems.length === 0 ? (
            <p className="empty-state">Nenhum item em atenção.</p>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Atual</th>
                  <th>Mínimo</th>
                </tr>
              </thead>
              <tbody>
                {summary.lowStockItems.map((i) => (
                  <tr key={i.id}>
                    <td>{i.name}</td>
                    <td>
                      {i.current_quantity} {i.unit}
                    </td>
                    <td>
                      {i.min_quantity} {i.unit}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
