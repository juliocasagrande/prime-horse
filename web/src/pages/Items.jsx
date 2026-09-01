import { useCallback, useEffect, useMemo, useState } from "react";
import { api } from "../lib/api";
import { useAuth } from "../contexts/AuthContext";
import { StatusBadge } from "../components/StatusBadge";
import { CustomSelect } from "../components/CustomSelect";
import { ConfirmModal, Modal } from "../components/Modal";
import { Wizard } from "../components/Wizard";
import { Toast } from "../components/Toast";
import { Icon } from "../components/Icons";
import "./pages.css";

const emptyForm = {
  name: "", categoryId: "", locationId: "", unit: "", customUnit: "",
  currentQuantity: "0", minQuantity: "0", expiryDate: "", supplier: "", costPrice: "",
};
const steps = ["Identificação", "Quantidades", "Detalhes", "Revisão"];

function Field({ label, children, hint }) {
  return <div className="field"><label>{label}</label>{children}{hint && <span className="field-hint">{hint}</span>}</div>;
}

export default function Items() {
  const { profile } = useAuth();
  const isAdmin = profile?.role === "admin";
  const isReadOnly = profile?.role === "financeiro";
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [locations, setLocations] = useState([]);
  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [wizardOpen, setWizardOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [form, setForm] = useState(emptyForm);
  const [editingItem, setEditingItem] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [toast, setToast] = useState("");
  const closeToast = useCallback(() => setToast(""), []);

  async function loadAll() {
    setLoading(true);
    setError("");
    try {
      const [itemsData, categoriesData, locationsData, unitsData] = await Promise.all([
        api.get("/items"), api.get("/categories"), api.get("/locations"), api.get("/units"),
      ]);
      setItems(itemsData); setCategories(categoriesData); setLocations(locationsData); setUnits(unitsData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadAll(); }, []);

  const filtered = useMemo(() => {
    const term = search.trim().toLocaleLowerCase("pt-BR");
    return term ? items.filter((item) => item.name.toLocaleLowerCase("pt-BR").includes(term)) : items;
  }, [items, search]);

  const categoryOptions = [{ value: "", label: "Sem categoria" }, ...categories.map((item) => ({ value: item.id, label: item.name }))];
  const locationOptions = [{ value: "", label: "Sem local" }, ...locations.map((item) => ({ value: item.id, label: item.name }))];
  const unitOptions = [...units.map((item) => ({ value: item.name, label: item.name })), { value: "__custom__", label: "Outra (digitar)" }];
  const selectedUnit = form.unit === "__custom__" ? form.customUnit.trim() : form.unit;
  const findName = (collection, id, fallback) => collection.find((item) => item.id === id)?.name || fallback;

  function openNew() {
    setForm(emptyForm); setFormError(""); setStep(0); setWizardOpen(true);
  }

  function openEdit(item) {
    setEditingItem({
      id: item.id, name: item.name, currentQuantity: String(item.current_quantity),
      minQuantity: String(item.min_quantity), supplier: item.supplier || "",
    });
    setFormError("");
  }

  function stepValid() {
    if (step === 0) return Boolean(form.name.trim());
    if (step === 1) return Boolean(selectedUnit) && form.currentQuantity !== "" && form.minQuantity !== "";
    return true;
  }

  function payloadFromForm() {
    return {
      name: form.name.trim(), categoryId: form.categoryId || null, locationId: form.locationId || null,
      unit: selectedUnit, currentQuantity: Number(form.currentQuantity) || 0, minQuantity: Number(form.minQuantity) || 0,
      expiryDate: form.expiryDate || null, supplier: form.supplier.trim() || null,
      costPrice: form.costPrice === "" ? null : Number(form.costPrice),
    };
  }

  async function nextStep() {
    if (!stepValid()) return;
    if (step < steps.length - 1) {
      setStep((current) => current + 1);
      return;
    }
    setSaving(true); setFormError("");
    try {
      await api.post("/items", payloadFromForm());
      setWizardOpen(false); setToast("Item criado com sucesso."); await loadAll();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function saveEdit(event) {
    event.preventDefault();
    if (!editingItem.name.trim()) return;
    setSaving(true); setFormError("");
    try {
      await api.patch("/items/" + editingItem.id, {
        name: editingItem.name.trim(), currentQuantity: Number(editingItem.currentQuantity) || 0,
        minQuantity: Number(editingItem.minQuantity) || 0, supplier: editingItem.supplier.trim() || null,
      });
      setEditingItem(null); setToast("Item atualizado com sucesso."); await loadAll();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function deleteItem() {
    setSaving(true);
    try {
      await api.delete("/items/" + deleteTarget.id);
      setDeleteTarget(null); setToast("Item excluído com sucesso."); await loadAll();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  function renderWizardStep() {
    if (step === 0) return (
      <>
        <h3 className="wizard-section-title">Identifique o novo item</h3>
        <Field label="Nome do item"><input className="input" autoFocus value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="Ex.: Ração premium" /></Field>
        <div className="form-row">
          <Field label="Categoria"><CustomSelect value={form.categoryId} onChange={(value) => setForm({ ...form, categoryId: value })} options={categoryOptions} /></Field>
          <Field label="Local de armazenamento"><CustomSelect value={form.locationId} onChange={(value) => setForm({ ...form, locationId: value })} options={locationOptions} /></Field>
        </div>
      </>
    );
    if (step === 1) return (
      <>
        <h3 className="wizard-section-title">Defina as quantidades</h3>
        <Field label="Unidade de medida"><CustomSelect value={form.unit} onChange={(value) => setForm({ ...form, unit: value })} options={unitOptions} placeholder="Selecione uma unidade..." /></Field>
        {form.unit === "__custom__" && <Field label="Outra unidade"><input className="input" autoFocus value={form.customUnit} onChange={(event) => setForm({ ...form, customUnit: event.target.value })} placeholder="Ex.: fardo" /></Field>}
        <div className="form-row">
          <Field label="Quantidade atual"><input className="input" type="number" step="any" value={form.currentQuantity} onChange={(event) => setForm({ ...form, currentQuantity: event.target.value })} /></Field>
          <Field label="Quantidade mínima de alerta"><input className="input" type="number" step="any" value={form.minQuantity} onChange={(event) => setForm({ ...form, minQuantity: event.target.value })} /></Field>
        </div>
      </>
    );
    if (step === 2) return (
      <>
        <h3 className="wizard-section-title">Complete os detalhes opcionais</h3>
        <div className="form-row">
          <Field label="Validade"><input className="input" type="date" value={form.expiryDate} onChange={(event) => setForm({ ...form, expiryDate: event.target.value })} /></Field>
          <Field label="Preço de custo"><input className="input" type="number" min="0" step="0.01" value={form.costPrice} onChange={(event) => setForm({ ...form, costPrice: event.target.value })} placeholder="0,00" /></Field>
        </div>
        <Field label="Fornecedor"><input className="input" value={form.supplier} onChange={(event) => setForm({ ...form, supplier: event.target.value })} placeholder="Nome do fornecedor" /></Field>
      </>
    );
    return (
      <>
        <h3 className="wizard-section-title">Revise antes de criar</h3>
        <dl className="review-list">
          <div className="review-row"><dt>Item</dt><dd>{form.name}</dd></div>
          <div className="review-row"><dt>Categoria</dt><dd>{findName(categories, form.categoryId, "Sem categoria")}</dd></div>
          <div className="review-row"><dt>Local</dt><dd>{findName(locations, form.locationId, "Sem local")}</dd></div>
          <div className="review-row"><dt>Quantidade</dt><dd>{form.currentQuantity} {selectedUnit}</dd></div>
          <div className="review-row"><dt>Alerta mínimo</dt><dd>{form.minQuantity} {selectedUnit}</dd></div>
          <div className="review-row"><dt>Fornecedor</dt><dd>{form.supplier || "Não informado"}</dd></div>
        </dl>
        {formError && <p className="auth-error">{formError}</p>}
      </>
    );
  }

  return (
    <div className="page">
      <div className="page-header">
        <div className="page-header-copy"><h1>Itens de estoque</h1><p>Consulte e mantenha organizados os insumos, medicamentos e materiais do haras.</p></div>
        <div className="page-header-actions">
          {isReadOnly && <span className="read-only-badge"><Icon name="lock" size={14} /> Modo somente leitura</span>}
          {isAdmin && <button className="btn" onClick={openNew}><Icon name="plus" size={17} /> Novo item</button>}
        </div>
      </div>
      <div className="search-box"><Icon name="search" size={18} /><input className="input" placeholder="Buscar por nome..." value={search} onChange={(event) => setSearch(event.target.value)} /></div>
      {error && <p className="negative-note"><Icon name="alert" size={17} />{error}</p>}
      <div className="card table-card">
        {loading ? <p className="empty-state">Carregando itens...</p> : !filtered.length ? <p className="empty-state">Nenhum item encontrado.</p> : (
          <table>
            <thead><tr><th>Nome</th><th>Categoria</th><th>Local</th><th>Qtd.</th><th>Status</th>{isAdmin && <th>Ações</th>}</tr></thead>
            <tbody>{filtered.map((item) => (
              <tr key={item.id}>
                <td className="table-primary">{item.name}</td>
                <td>{item.category?.name || "—"}</td><td>{item.location?.name || "—"}</td>
                <td className={Number(item.current_quantity) < 0 ? "quantity-negative" : ""}>{item.current_quantity} {item.unit}</td>
                <td><StatusBadge status={item.status} /></td>
                {isAdmin && <td><div className="inline-actions">
                  <button className="icon-btn" onClick={() => openEdit(item)}><Icon name="edit" size={14} /> Editar</button>
                  <button className="icon-btn danger" onClick={() => setDeleteTarget(item)}><Icon name="trash" size={14} /> Excluir</button>
                </div></td>}
              </tr>
            ))}</tbody>
          </table>
        )}
      </div>

      {wizardOpen && <Wizard title="Novo item de estoque" steps={steps} step={step} onClose={() => setWizardOpen(false)} onBack={() => setStep((current) => current - 1)} onNext={nextStep} nextLabel={step === 3 ? "Criar item" : "Continuar"} nextDisabled={!stepValid()} saving={saving}>{renderWizardStep()}</Wizard>}

      {editingItem && <Modal title="Editar item" onClose={() => setEditingItem(null)} actions={<><button type="button" className="btn btn-secondary" onClick={() => setEditingItem(null)}>Cancelar</button><button type="submit" form="edit-item-form" className="btn" disabled={saving || !editingItem.name.trim()}>{saving ? "Salvando..." : "Salvar alterações"}</button></>}>
        <form id="edit-item-form" onSubmit={saveEdit}>
          <Field label="Nome"><input className="input" value={editingItem.name} onChange={(event) => setEditingItem({ ...editingItem, name: event.target.value })} /></Field>
          <div className="form-row">
            <Field label="Quantidade atual"><input className="input" type="number" step="any" value={editingItem.currentQuantity} onChange={(event) => setEditingItem({ ...editingItem, currentQuantity: event.target.value })} /></Field>
            <Field label="Quantidade mínima"><input className="input" type="number" step="any" value={editingItem.minQuantity} onChange={(event) => setEditingItem({ ...editingItem, minQuantity: event.target.value })} /></Field>
          </div>
          <Field label="Fornecedor"><input className="input" value={editingItem.supplier} onChange={(event) => setEditingItem({ ...editingItem, supplier: event.target.value })} /></Field>
          {formError && <p className="auth-error">{formError}</p>}
        </form>
      </Modal>}

      {deleteTarget && <ConfirmModal title="Excluir item" message={'Tem certeza que deseja excluir "' + deleteTarget.name + '"? Esta ação não pode ser desfeita.'} confirmLabel="Excluir item" danger busy={saving} onCancel={() => setDeleteTarget(null)} onConfirm={deleteItem} />}
      {toast && <Toast message={toast} onClose={closeToast} />}
    </div>
  );
}
