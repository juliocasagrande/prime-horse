import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { useAuth } from "../contexts/AuthContext";
import { queueMovement, flushQueuedMovements } from "../lib/offlineQueue";
import { useOnlineStatus } from "../lib/useOnlineStatus";
import "./pages.css";

const emptyForm = { itemId: "", type: "saida", quantity: "", reason: "" };

export default function Movements() {
  const { profile } = useAuth();
  const canRegister = profile?.role === "admin" || profile?.role === "operador";
  const online = useOnlineStatus();

  const [items, setItems] = useState([]);
  const [movements, setMovements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [formNotice, setFormNotice] = useState("");

  async function loadMovements() {
    const data = await api.get("/movements");
    setMovements(data);
  }

  async function loadAll() {
    setLoading(true);
    try {
      const [itemsData] = await Promise.all([api.get("/items"), loadMovements()]);
      setItems(itemsData);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
  }, []);

  useEffect(() => {
    if (online) flushQueuedMovements(() => loadMovements());
  }, [online]);

  async function handleSubmit(e) {
    e.preventDefault();
    setFormError("");
    setFormNotice("");

    if (!form.itemId || !form.quantity || !form.reason.trim()) {
      setFormError("Item, quantidade e motivo/observação são obrigatórios.");
      return;
    }
    const quantity = Number(form.quantity);
    if (!quantity || quantity <= 0) {
      setFormError("Quantidade deve ser maior que zero.");
      return;
    }

    const payload = {
      itemId: form.itemId,
      type: form.type,
      quantity,
      reason: form.reason.trim(),
      occurredAt: new Date().toISOString(),
    };

    setSaving(true);
    try {
      const result = await api.post("/movements", payload);
      setForm(emptyForm);
      if (result.isNegative) {
        setFormNotice(
          `Movimentação registrada. Atenção: o saldo do item ficou negativo (${result.resultingQuantity}).`
        );
      } else {
        setFormNotice("Movimentação registrada com sucesso.");
      }
      await loadMovements();
    } catch (err) {
      if (err.isNetworkError) {
        await queueMovement(payload);
        setForm(emptyForm);
        setFormNotice("Sem conexão: movimentação salva localmente e será sincronizada automaticamente.");
      } else {
        setFormError(err.message);
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Entrada & Saída</h1>
          <p>Registro de movimentações e histórico do estoque.</p>
        </div>
      </div>

      {canRegister && (
        <form className="card section-card" onSubmit={handleSubmit}>
          <h3>Nova movimentação</h3>
          <div className="form-row">
            <div className="field">
              <label>Item</label>
              <select
                className="input"
                value={form.itemId}
                onChange={(e) => setForm({ ...form, itemId: e.target.value })}
              >
                <option value="">Selecione um item...</option>
                {items.map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.name} ({i.current_quantity} {i.unit})
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>Tipo</label>
              <select className="input" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                <option value="entrada">Entrada</option>
                <option value="saida">Saída</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="field">
              <label>Quantidade</label>
              <input
                className="input"
                type="number"
                step="any"
                min="0"
                value={form.quantity}
                onChange={(e) => setForm({ ...form, quantity: e.target.value })}
              />
            </div>
            <div className="field">
              <label>Motivo/observação</label>
              <input
                className="input"
                placeholder="ex: uso veterinário, compra mensal, perda"
                value={form.reason}
                onChange={(e) => setForm({ ...form, reason: e.target.value })}
              />
            </div>
          </div>

          {formError && <p className="auth-error">{formError}</p>}
          {formNotice && <p className="auth-success">{formNotice}</p>}

          <button className="btn" type="submit" disabled={saving}>
            {saving ? "Registrando..." : "Registrar movimentação"}
          </button>
        </form>
      )}

      <div className="card table-card">
        <div style={{ padding: "1rem 1.2rem 0" }}>
          <h3>Histórico</h3>
        </div>
        {loading ? (
          <p className="empty-state">Carregando histórico...</p>
        ) : movements.length === 0 ? (
          <p className="empty-state">Nenhuma movimentação registrada ainda.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Data/hora</th>
                <th>Item</th>
                <th>Tipo</th>
                <th>Quantidade</th>
                <th>Saldo após</th>
                <th>Responsável</th>
                <th>Motivo</th>
              </tr>
            </thead>
            <tbody>
              {movements.map((m) => (
                <tr key={m.id}>
                  <td>{new Date(m.occurred_at).toLocaleString("pt-BR")}</td>
                  <td>{m.item?.name}</td>
                  <td>{m.type === "entrada" ? "Entrada" : "Saída"}</td>
                  <td>
                    {m.quantity} {m.item?.unit}
                  </td>
                  <td style={{ color: m.resulting_quantity < 0 ? "var(--status-negative-text)" : "inherit" }}>
                    {m.resulting_quantity} {m.item?.unit}
                  </td>
                  <td>{m.user_name}</td>
                  <td>{m.reason}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
