import { useState } from "react";
import { api } from "../lib/api";
import { ConfirmModal, Modal } from "./Modal";
import { Icon } from "./Icons";

export function ResourceManager({ title, resource, items, onChange, onSuccess, icon = "settings" }) {
  const [newName, setNewName] = useState("");
  const [editTarget, setEditTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function add(event) {
    event.preventDefault();
    if (!newName.trim()) return;
    setSaving(true); setError("");
    try {
      await api.post("/" + resource, { name: newName.trim() });
      setNewName(""); onSuccess(title + ": item adicionado com sucesso."); await onChange();
    } catch (err) { setError(err.message); }
    finally { setSaving(false); }
  }

  async function rename(event) {
    event.preventDefault();
    if (!editTarget.name.trim()) return;
    setSaving(true); setError("");
    try {
      await api.patch("/" + resource + "/" + editTarget.id, { name: editTarget.name.trim() });
      setEditTarget(null); onSuccess("Alteração salva com sucesso."); await onChange();
    } catch (err) { setError(err.message); }
    finally { setSaving(false); }
  }

  async function remove() {
    setSaving(true); setError("");
    try {
      await api.delete("/" + resource + "/" + deleteTarget.id);
      setDeleteTarget(null); onSuccess("Item excluído com sucesso."); await onChange();
    } catch (err) { setError(err.message); }
    finally { setSaving(false); }
  }

  return (
    <section className="card section-card">
      <header className="resource-heading"><span className="resource-heading-icon"><Icon name={icon} size={17} /></span><h3>{title}</h3></header>
      <div className="resource-body">
        {error && <p className="auth-error">{error}</p>}
        <ul className="list-with-actions">
          {items.map((item) => (
            <li key={item.id}>
              <span>{item.name}</span>
              <div className="inline-actions">
                <button className="icon-btn" onClick={() => setEditTarget({ ...item })} aria-label={"Editar " + item.name}><Icon name="edit" size={14} /></button>
                <button className="icon-btn danger" onClick={() => setDeleteTarget(item)} aria-label={"Excluir " + item.name}><Icon name="trash" size={14} /></button>
              </div>
            </li>
          ))}
          {!items.length && <li className="table-muted">Nenhum item cadastrado.</li>}
        </ul>
        <form className="resource-add-form" onSubmit={add}>
          <input className="input" placeholder="Adicionar novo..." value={newName} onChange={(event) => setNewName(event.target.value)} />
          <button className="btn" type="submit" disabled={saving || !newName.trim()}>Adicionar</button>
        </form>
      </div>
      {editTarget && <Modal title={"Editar " + title.toLocaleLowerCase("pt-BR")} onClose={() => setEditTarget(null)} actions={<><button type="button" className="btn btn-secondary" onClick={() => setEditTarget(null)}>Cancelar</button><button type="submit" form={"edit-" + resource} className="btn" disabled={saving || !editTarget.name.trim()}>{saving ? "Salvando..." : "Salvar"}</button></>}>
        <form id={"edit-" + resource} onSubmit={rename}><div className="field"><label>Nome</label><input className="input" autoFocus value={editTarget.name} onChange={(event) => setEditTarget({ ...editTarget, name: event.target.value })} /></div></form>
      </Modal>}
      {deleteTarget && <ConfirmModal title="Excluir item" message={'Deseja excluir "' + deleteTarget.name + '" da lista de ' + title.toLocaleLowerCase("pt-BR") + "? Esta ação não pode ser desfeita."} confirmLabel="Excluir" danger busy={saving} onCancel={() => setDeleteTarget(null)} onConfirm={remove} />}
    </section>
  );
}
