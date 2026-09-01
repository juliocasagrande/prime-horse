import { useEffect, useMemo, useState } from "react";
import { api } from "../lib/api";
import { useAuth } from "../contexts/AuthContext";
import { StatusBadge } from "../components/StatusBadge";
import "./pages.css";

const emptyForm = {
  name: "",
  categoryId: "",
  locationId: "",
  unit: "",
  customUnit: "",
  currentQuantity: "0",
  minQuantity: "0",
  expiryDate: "",
  supplier: "",
  costPrice: "",
};

export default function Items() {
  const { profile } = useAuth();
  const isAdmin = profile?.role === "admin";

  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [locations, setLocations] = useState([]);
  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  async function loadAll() {
    setLoading(true);
    try {
      const [itemsData, categoriesData, locationsData, unitsData] = await Promise.all([
        api.get("/items"),
        api.get("/categories"),
        api.get("/locations"),
        api.get("/units"),
      ]);
      setItems(itemsData);
      setCategories(categoriesData);
      setLocations(locationsData);
      setUnits(unitsData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
  }, []);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return items;
    return items.filter((i) => i.name.toLowerCase().includes(term));
  }, [items, search]);

  function openNew() {
    setEditingId(null);
    setForm(emptyForm);
    setFormError("");
    setModalOpen(true);
  }

  function openEdit(item) {
    setEditingId(item.id);
    const knownUnit = units.some((u) => u.name === item.unit);
    setForm({
      name: item.name,
      categoryId: item.category_id || "",
      locationId: item.location_id || "",
      unit: knownUnit ? item.unit : "__custom__",
      customUnit: knownUnit ? "" : item.unit,
      currentQuantity: String(item.current_quantity),
      minQuantity: String(item.min_quantity),
      expiryDate: item.expiry_date || "",
      supplier: item.supplier || "",
      costPrice: item.cost_price ?? "",
    });
    setFormError("");
    setModalOpen(true);
  }

  async function handleDelete(item) {
    if (!confirm(`Excluir o item "${item.name}"? Esta ação não pode ser desfeita.`)) return;
    try {
      await api.delete(`/items/${item.id}`);
      await loadAll();
    } catch (err) {
      alert(err.message);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setFormError("");
    const unit = form.unit === "__custom__" ? form.customUnit.trim() : form.unit;
    if (!form.name.trim() || !unit) {
      setFormError("Nome e unidade de medida são obrigatórios.");
      return;
    }

    const payload = {
      name: form.name.trim(),
      categoryId: form.categoryId || null,
      locationId: form.locationId || null,
      unit,
      currentQuantity: Number(form.currentQuantity) || 0,
      minQuantity: Number(form.minQuantity) || 0,
      expiryDate: form.expiryDate || null,
      supplier: form.supplier.trim() || null,
      costPrice: form.costPrice === "" ? null : Number(form.costPrice),
    };

    setSaving(true);
    try {
      if (editingId) {
        await api.patch(`/items/${editingId}`, payload);
      } else {
        await api.post("/items", payload);
      }
      setModalOpen(false);
      await loadAll();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Itens de estoque</h1>
          <p>Feno, insumos e medicamentos cadastrados.</p>
        </div>
        {isAdmin && (
          <button className="btn" onClick={openNew}>
            + Novo item
          </button>
        )}
      </div>

      <div className="field" style={{ maxWidth: 320, marginBottom: "1rem" }}>
        <input
          className="input"
          placeholder="Buscar por nome..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {error && <p className="negative-note">{error}</p>}

      <div className="card table-card">
        {loading ? (
          <p className="empty-state">Carregando itens...</p>
        ) : filtered.length === 0 ? (
          <p className="empty-state">Nenhum item encontrado.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Nome</th>
                <th>Categoria</th>
                <th>Local</th>
                <th>Quantidade</th>
                <th>Mínimo</th>
                <th>Validade</th>
                <th>Status</th>
                {isAdmin && <th></th>}
              </tr>
            </thead>
            <tbody>
              {filtered.map((item) => (
                <tr key={item.id}>
                  <td>{item.name}</td>
                  <td>{item.category?.name || "—"}</td>
                  <td>{item.location?.name || "—"}</td>
                  <td>
                    {item.current_quantity} {item.unit}
                  </td>
                  <td>
                    {item.min_quantity} {item.unit}
                  </td>
                  <td>{item.expiry_date ? new Date(item.expiry_date).toLocaleDateString("pt-BR") : "—"}</td>
                  <td>
                    <StatusBadge status={item.status} />
                  </td>
                  {isAdmin && (
                    <td>
                      <div className="inline-actions">
                        <button className="icon-btn" onClick={() => openEdit(item)}>
                          Editar
                        </button>
                        <button className="icon-btn" onClick={() => handleDelete(item)}>
                          Excluir
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {modalOpen && (
        <div className="modal-overlay" onClick={() => setModalOpen(false)}>
          <form className="card modal-card" onClick={(e) => e.stopPropagation()} onSubmit={handleSubmit}>
            <h2>{editingId ? "Editar item" : "Novo item"}</h2>

            <div className="field">
              <label>Nome</label>
              <input
                className="input"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>

            <div className="form-row">
              <div className="field">
                <label>Categoria</label>
                <select
                  className="input"
                  value={form.categoryId}
                  onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
                >
                  <option value="">Sem categoria</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label>Local de armazenamento</label>
                <select
                  className="input"
                  value={form.locationId}
                  onChange={(e) => setForm({ ...form, locationId: e.target.value })}
                >
                  <option value="">Sem local</option>
                  {locations.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="field">
                <label>Unidade de medida</label>
                <select
                  className="input"
                  value={form.unit}
                  onChange={(e) => setForm({ ...form, unit: e.target.value })}
                >
                  <option value="">Selecione...</option>
                  {units.map((u) => (
                    <option key={u.id} value={u.name}>
                      {u.name}
                    </option>
                  ))}
                  <option value="__custom__">Outra (digitar)...</option>
                </select>
              </div>
              {form.unit === "__custom__" && (
                <div className="field">
                  <label>Unidade personalizada</label>
                  <input
                    className="input"
                    value={form.customUnit}
                    onChange={(e) => setForm({ ...form, customUnit: e.target.value })}
                  />
                </div>
              )}
            </div>

            <div className="form-row">
              <div className="field">
                <label>Quantidade atual</label>
                <input
                  className="input"
                  type="number"
                  step="any"
                  value={form.currentQuantity}
                  onChange={(e) => setForm({ ...form, currentQuantity: e.target.value })}
                />
              </div>
              <div className="field">
                <label>Quantidade mínima de alerta</label>
                <input
                  className="input"
                  type="number"
                  step="any"
                  value={form.minQuantity}
                  onChange={(e) => setForm({ ...form, minQuantity: e.target.value })}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="field">
                <label>Validade (opcional)</label>
                <input
                  className="input"
                  type="date"
                  value={form.expiryDate}
                  onChange={(e) => setForm({ ...form, expiryDate: e.target.value })}
                />
              </div>
              <div className="field">
                <label>Preço de custo (opcional)</label>
                <input
                  className="input"
                  type="number"
                  step="any"
                  value={form.costPrice}
                  onChange={(e) => setForm({ ...form, costPrice: e.target.value })}
                />
              </div>
            </div>

            <div className="field">
              <label>Fornecedor (opcional)</label>
              <input
                className="input"
                value={form.supplier}
                onChange={(e) => setForm({ ...form, supplier: e.target.value })}
              />
            </div>

            {formError && <p className="auth-error">{formError}</p>}

            <div className="modal-actions">
              <button type="button" className="btn btn-secondary" onClick={() => setModalOpen(false)}>
                Cancelar
              </button>
              <button type="submit" className="btn" disabled={saving}>
                {saving ? "Salvando..." : "Salvar"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
