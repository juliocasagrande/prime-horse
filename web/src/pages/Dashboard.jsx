import { useCallback, useEffect, useMemo, useState } from "react";
import { api } from "../lib/api";
import { subscribeToPush } from "../lib/push";
import { Icon } from "../components/Icons";
import { StatusBadge } from "../components/StatusBadge";
import { Toast } from "../components/Toast";
import "./pages.css";

function itemStatus(item) {
  if (Number(item.current_quantity) < 0) return "negative";
  if (Number(item.current_quantity) <= Number(item.min_quantity)) return "low";
  return "ok";
}

function StatCard({ icon, value, label, tone = "primary" }) {
  return (
    <article className={`card stat-card ${tone}`}>
      <span className="stat-icon"><Icon name={icon} size={18} /></span>
      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>
    </article>
  );
}

function CardHeader({ title, children }) {
  return (
    <header className="card-strip-header">
      <h3>{title}</h3>
      {children}
    </header>
  );
}

export default function Dashboard() {
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState("");
  const [pushStatus, setPushStatus] = useState(null);
  const [toast, setToast] = useState("");
  const closeToast = useCallback(() => setToast(""), []);

  useEffect(() => {
    api.get("/dashboard/summary").then(setSummary).catch((err) => setError(err.message));
  }, []);

  const movementChart = useMemo(() => {
    const movements = summary?.recentMovements?.slice(0, 6).reverse() || [];
    const maxQuantity = Math.max(1, ...movements.map((movement) => Number(movement.quantity) || 0));
    return movements.map((movement) => ({
      ...movement,
      height: Math.max(10, Math.round(((Number(movement.quantity) || 0) / maxQuantity) * 100)),
      shortLabel: movement.item?.name?.length > 9 ? `${movement.item.name.slice(0, 8)}…` : movement.item?.name,
    }));
  }, [summary]);

  async function handleEnablePush() {
    const result = await subscribeToPush();
    setPushStatus(result);
    if (result.ok) setToast("Notificações push ativadas com sucesso.");
  }

  if (error) return <p className="negative-note">{error}</p>;
  if (!summary) return <p className="empty-state">Carregando painel...</p>;

  const categories = summary.categoryDistribution || [];

  return (
    <div className="page">
      <div className="page-header">
        <div className="page-header-copy">
          <h1>Painel geral</h1>
          <p>Visão resumida e atualizada do estoque da Prime Horse.</p>
        </div>
        <div className="page-header-actions">
          <button className={`btn ${pushStatus?.ok ? "" : "btn-secondary"}`} onClick={handleEnablePush}>
            <Icon name={pushStatus?.ok ? "check" : "bell"} size={17} />
            {pushStatus?.ok ? "Notificações ativadas" : "Ativar notificações push"}
          </button>
        </div>
      </div>

      {pushStatus && !pushStatus.ok && (
        <p className="negative-note">
          <Icon name="alert" size={17} />
          {pushStatus.reason === "denied" && "Permissão negada. Ative as notificações nas configurações do navegador."}
          {pushStatus.reason === "unsupported" && "Este navegador não suporta notificações push."}
          {pushStatus.reason === "not-configured" && "As notificações push ainda não foram configuradas no servidor."}
        </p>
      )}

      <div className="grid-cards">
        <StatCard icon="box" value={summary.totalItems} label="Itens cadastrados" />
        <StatCard icon="users" value={summary.activeUsers} label="Usuários ativos" />
        <StatCard icon="alert" value={summary.lowStockCount} label="Itens em atenção (estoque baixo)" tone="low" />
        <StatCard icon="negative" value={summary.negativeCount} label="Itens com saldo negativo" tone="negative" />
      </div>

      <div className="charts-grid">
        <section className="card dashboard-card">
          <CardHeader title="Movimentações recentes">
            <div className="chart-legend" aria-label="Legenda do gráfico">
              <span><i className="legend-entry" />Entrada</span>
              <span><i className="legend-exit" />Saída</span>
            </div>
          </CardHeader>
          {!movementChart.length ? <p className="empty-state chart-empty">Nenhuma movimentação ainda.</p> : (
            <div className="movement-chart" aria-label="Gráfico das últimas seis movimentações">
              {movementChart.map((movement) => (
                <div className="movement-bar-column" key={movement.id} title={`${movement.item?.name}: ${movement.quantity} ${movement.item?.unit || ""}`}>
                  <strong>{movement.quantity}</strong>
                  <span className={`movement-bar ${movement.type}`} style={{ height: `${movement.height}%` }} />
                  <small>{movement.shortLabel}</small>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="card dashboard-card">
          <CardHeader title="Itens por categoria" />
          {!categories.length ? <p className="empty-state chart-empty">Nenhuma categoria com itens.</p> : (
            <div className="category-chart">
              {categories.map((category, index) => {
                const width = summary.totalItems ? Math.round((category.count / summary.totalItems) * 100) : 0;
                return (
                  <div className="category-row" key={category.id}>
                    <div><span>{category.name}</span><strong>{category.count}</strong></div>
                    <div className="category-track"><span style={{ width: `${width}%`, opacity: Math.max(.42, 1 - (index * .15)) }} /></div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>

      <div className="two-col">
        <section className="card dashboard-card">
          <CardHeader title="Últimas movimentações" />
          {!summary.recentMovements?.length ? <p className="empty-state">Nenhuma movimentação ainda.</p> : (
            <div className="dashboard-list">
              {summary.recentMovements.slice(0, 5).map((movement) => (
                <div className="dashboard-list-row" key={movement.id}>
                  <div>
                    <strong>{movement.item?.name}</strong>
                    <small>{movement.reason || "Sem motivo informado"}{movement.user_name ? ` · ${movement.user_name}` : ""}</small>
                  </div>
                  <span className={`badge movement-type ${movement.type}`}>{movement.type === "entrada" ? "Entrada" : "Saída"} {movement.quantity}</span>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="card dashboard-card">
          <CardHeader title="Itens em estoque baixo" />
          {!summary.lowStockItems?.length ? <p className="empty-state">Tudo certo por aqui.</p> : (
            <div className="dashboard-list">
              {summary.lowStockItems.slice(0, 5).map((item) => (
                <div className="dashboard-list-row" key={item.id}>
                  <div>
                    <strong>{item.name}</strong>
                    <small>{item.location?.name || `${item.current_quantity} ${item.unit}`}</small>
                  </div>
                  <StatusBadge status={itemStatus(item)} />
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
      {toast && <Toast message={toast} onClose={closeToast} />}
    </div>
  );
}
