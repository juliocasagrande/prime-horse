import { useState } from "react";
import { api } from "../lib/api";

// Usado para categorias, locais e unidades: mesma forma { id, name },
// leitura já carregada pelo pai, escrita via endpoint REST /api/<resource>.
export function ResourceManager({ title, resource, items, onChange }) {
  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState("");
  const [error, setError] = useState("");

  async function handleAdd(e) {
    e.preventDefault();
    setError("");
    if (!newName.trim()) return;
    try {
      await api.post(`/${resource}`, { name: newName.trim() });
      setNewName("");
      onChange();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleRename(id) {
    if (!editingName.trim()) return;
    try {
      await api.patch(`/${resource}/${id}`, { name: editingName.trim() });
      setEditingId(null);
      onChange();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleDelete(id) {
    if (!confirm("Remover este item da lista?")) return;
    try {
      await api.delete(`/${resource}/${id}`);
      onChange();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="card section-card">
      <h3>{title}</h3>
      {error && <p className="auth-error">{error}</p>}
      <ul className="list-with-actions">
        {items.map((item) =>
          editingId === item.id ? (
            <li key={item.id}>
              <input
                className="input"
                value={editingName}
                onChange={(e) => setEditingName(e.target.value)}
                autoFocus
              />
              <div className="inline-actions">
                <button className="icon-btn" onClick={() => handleRename(item.id)}>
                  Salvar
                </button>
                <button className="icon-btn" onClick={() => setEditingId(null)}>
                  Cancelar
                </button>
              </div>
            </li>
          ) : (
            <li key={item.id}>
              <span>{item.name}</span>
              <div className="inline-actions">
                <button
                  className="icon-btn"
                  onClick={() => {
                    setEditingId(item.id);
                    setEditingName(item.name);
                  }}
                >
                  Editar
                </button>
                <button className="icon-btn" onClick={() => handleDelete(item.id)}>
                  Excluir
                </button>
              </div>
            </li>
          )
        )}
        {items.length === 0 && <li style={{ color: "var(--text-muted)" }}>Nenhum item cadastrado.</li>}
      </ul>
      <form style={{ display: "flex", gap: "0.5rem", marginTop: "0.8rem" }} onSubmit={handleAdd}>
        <input
          className="input"
          placeholder="Adicionar novo..."
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
        />
        <button className="btn" type="submit">
          Adicionar
        </button>
      </form>
    </div>
  );
}
