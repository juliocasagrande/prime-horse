import { useCallback, useEffect, useMemo, useState } from "react";
import { api } from "../lib/api";
import { useAuth } from "../contexts/AuthContext";
import { queueMovement, flushQueuedMovements } from "../lib/offlineQueue";
import { useOnlineStatus } from "../lib/useOnlineStatus";
import { CustomSelect } from "../components/CustomSelect";
import { Wizard } from "../components/Wizard";
import { Toast } from "../components/Toast";
import { Icon } from "../components/Icons";
import "./pages.css";

const emptyForm = { itemId: "", type: "saida", quantity: "", reason: "" };
const steps = ["Item e tipo", "Quantidade", "Revisão"];

export default function Movements() {
  const { profile } = useAuth();
  const canRegister = profile?.role === "admin" || profile?.role === "operador";
  const isReadOnly = profile?.role === "financeiro";
  const online = useOnlineStatus();
  const [items, setItems] = useState([]);
  const [movements, setMovements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [wizardOpen, setWizardOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [notice, setNotice] = useState(null);
  const [toast, setToast] = useState("");
  const closeToast = useCallback(() => setToast(""), []);

  async function loadMovements() {
    const data = await api.get("/movements");
    setMovements(data);
  }

  async function loadAll() {
    setLoading(true); setError("");
    try {
      const [itemsData] = await Promise.all([api.get("/items"), loadMovements()]);
      setItems(itemsData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadAll(); }, []);
  useEffect(() => { if (online) flushQueuedMovements(() => loadMovements()); }, [online]);

  const selectedItem = useMemo(() => items.find((item) => item.id === form.itemId), [items, form.itemId]);
  const quantity = Number(form.quantity) || 0;
  const resultingQuantity = selectedItem ? Number(selectedItem.current_quantity) + (form.type === "entrada" ? quantity : -quantity) : 0;
  const willBeNegative = selectedItem && resultingQuantity < 0;
  const willBeLow = selectedItem && !willBeNegative && resultingQuantity <= Number(selectedItem.min_quantity);
  const itemOptions = items.map((item) => ({ value: item.id, label: item.name + " · " + item.current_quantity + " " + item.unit }));

  function openWizard() {
    setForm(emptyForm); setStep(0); setFormError(""); setWizardOpen(true);
  }

  function stepValid() {
    if (step === 0) return Boolean(form.itemId && form.type);
    if (step === 1) return quantity > 0 && Boolean(form.reason.trim());
    return true;
  }

  async function nextStep() {
    setFormError("");
    if (!stepValid()) return;
    if (step < steps.length - 1) {
      setStep((current) => current + 1);
      return;
    }
    const payload = { itemId: form.itemId, type: form.type, quantity, reason: form.reason.trim(), occurredAt: new Date().toISOString() };
    setSaving(true);
    try {
      const result = await api.post("/movements", payload);
      setWizardOpen(false);
      if (result.isNegative) setNotice({ kind: "negative", message: "Movimentação registrada. O saldo do item ficou negativo (" + result.resultingQuantity + " " + selectedItem.unit + ")." });
      else if (result.resultingQuantity <= Number(selectedItem.min_quantity)) setNotice({ kind: "low", message: "Movimentação registrada. O item atingiu o estoque mínimo." });
      else setToast("Movimentação registrada com sucesso.");
      await loadAll();
    } catch (err) {
      if (err.isNetworkError) {
        await queueMovement(payload);
        setWizardOpen(false);
        setNotice({ kind: "low", message: "Sem conexão: movimentação salva no dispositivo e será sincronizada automaticamente." });
      } else {
        setFormError(err.message);
      }
    } finally {
      setSaving(false);
    }
  }

  function renderStep() {
    if (step === 0) return (
      <>
        <h3 className="wizard-section-title">Escolha o item e o tipo</h3>
        <div className="field"><label>Item</label><CustomSelect value={form.itemId} onChange={(value) => setForm({ ...form, itemId: value })} options={itemOptions} placeholder="Selecione um item..." /></div>
        {selectedItem && <div className="balance-preview"><span>Saldo atual</span><strong>{selectedItem.current_quantity} {selectedItem.unit}</strong></div>}
        <div className="field"><label>Tipo de movimentação</label>
          <div className="type-selector">
            <button type="button" className={"type-option " + (form.type === "entrada" ? "active" : "")} onClick={() => setForm({ ...form, type: "entrada" })}><Icon name="arrowRight" size={16} /> Entrada</button>
            <button type="button" className={"type-option " + (form.type === "saida" ? "active" : "")} onClick={() => setForm({ ...form, type: "saida" })}><Icon name="arrowLeft" size={16} /> Saída</button>
          </div>
        </div>
      </>
    );
    if (step === 1) return (
      <>
        <h3 className="wizard-section-title">Informe a quantidade e o motivo</h3>
        <div className="field"><label>Quantidade ({selectedItem?.unit})</label><input className="input" type="number" min="0" step="any" autoFocus value={form.quantity} onChange={(event) => setForm({ ...form, quantity: event.target.value })} /></div>
        <div className="field"><label>Motivo / observação</label><textarea className="input" value={form.reason} onChange={(event) => setForm({ ...form, reason: event.target.value })} placeholder="Ex.: uso veterinário, compra mensal, perda..." /></div>
      </>
    );
    return (
      <>
        <h3 className="wizard-section-title">Revise a movimentação</h3>
        <dl className="review-list">
          <div className="review-row"><dt>Item</dt><dd>{selectedItem?.name}</dd></div>
          <div className="review-row"><dt>Tipo</dt><dd>{form.type === "entrada" ? "Entrada" : "Saída"}</dd></div>
          <div className="review-row"><dt>Quantidade</dt><dd>{form.quantity} {selectedItem?.unit}</dd></div>
          <div className="review-row"><dt>Novo saldo</dt><dd className={willBeNegative ? "quantity-negative" : ""}>{resultingQuantity} {selectedItem?.unit}</dd></div>
          <div className="review-row"><dt>Motivo</dt><dd>{form.reason}</dd></div>
        </dl>
        {willBeNegative && <p className="negative-note" style={{ marginTop: 14 }}><Icon name="alert" size={17} />A saída será registrada, mas o saldo ficará negativo.</p>}
        {willBeLow && <p className="notice-note" style={{ marginTop: 14 }}><Icon name="alert" size={17} />O novo saldo ficará no limite de estoque baixo.</p>}
        {formError && <p className="auth-error" style={{ marginTop: 12 }}>{formError}</p>}
      </>
    );
  }

  return (
    <div className="page">
      <div className="page-header">
        <div className="page-header-copy"><h1>Entrada & Saída</h1><p>Registre movimentações e consulte o histórico completo do estoque.</p></div>
        <div className="page-header-actions">
          {isReadOnly && <span className="read-only-badge"><Icon name="lock" size={14} /> Modo somente leitura</span>}
          {canRegister && <button className="btn" onClick={openWizard}><Icon name="plus" size={17} /> Nova movimentação</button>}
        </div>
      </div>
      {notice && <p className={notice.kind === "negative" ? "negative-note" : "notice-note"}><Icon name="alert" size={17} />{notice.message}</p>}
      {error && <p className="negative-note"><Icon name="alert" size={17} />{error}</p>}
      <section className="card table-card">
        <div className="table-title"><div><h3>Histórico de movimentações</h3><p>Registros do mais recente para o mais antigo</p></div></div>
        {loading ? <p className="empty-state">Carregando histórico...</p> : !movements.length ? <p className="empty-state">Nenhuma movimentação registrada ainda.</p> : (
          <table>
            <thead><tr><th>Item</th><th>Tipo</th><th>Quantidade</th><th>Saldo resultante</th><th>Motivo</th><th>Responsável</th><th>Data</th></tr></thead>
            <tbody>{movements.map((movement) => (
              <tr key={movement.id}>
                <td className="table-primary">{movement.item?.name}</td>
                <td><span className={"badge movement-type " + movement.type}>{movement.type === "entrada" ? "Entrada" : "Saída"}</span></td>
                <td>{movement.quantity} {movement.item?.unit}</td>
                <td className={Number(movement.resulting_quantity) < 0 ? "quantity-negative" : ""}>{movement.resulting_quantity} {movement.item?.unit}</td>
                <td>{movement.reason}</td><td>{movement.user_name}</td>
                <td className="table-muted">{new Date(movement.occurred_at).toLocaleString("pt-BR")}</td>
              </tr>
            ))}</tbody>
          </table>
        )}
      </section>
      {wizardOpen && <Wizard title="Nova movimentação" steps={steps} step={step} onClose={() => setWizardOpen(false)} onBack={() => setStep((current) => current - 1)} onNext={nextStep} nextLabel={step === 2 ? "Registrar movimentação" : "Continuar"} nextDisabled={!stepValid()} saving={saving}>{renderStep()}</Wizard>}
      {toast && <Toast message={toast} onClose={closeToast} />}
    </div>
  );
}
