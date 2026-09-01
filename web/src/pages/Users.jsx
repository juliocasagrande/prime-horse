import { useEffect, useState } from "react";
import { api } from "../lib/api";
import "./pages.css";

const ROLE_LABEL = { admin: "Administrador", operador: "Operador de campo", financeiro: "Financeiro" };

function randomPassword() {
  return `PH-${Math.random().toString(36).slice(2, 8)}${Math.floor(Math.random() * 100)}`;
}

const emptyForm = { name: "", email: "", role: "operador", tempPassword: randomPassword() };

export default function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [createdInfo, setCreatedInfo] = useState(null);

  const [resetTarget, setResetTarget] = useState(null);
  const [resetPassword, setResetPassword] = useState("");

  async function loadUsers() {
    setLoading(true);
    try {
      setUsers(await api.get("/users"));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadUsers();
  }, []);

  function openNew() {
    setForm({ ...emptyForm, tempPassword: randomPassword() });
    setFormError("");
    setCreatedInfo(null);
    setModalOpen(true);
  }

  async function handleCreate(e) {
    e.preventDefault();
    setFormError("");
    if (!form.name.trim() || !form.email.trim() || !form.tempPassword) {
      setFormError("Nome, e-mail e senha temporária são obrigatórios.");
      return;
    }
    setSaving(true);
    try {
      await api.post("/users", form);
      setCreatedInfo({ email: form.email, tempPassword: form.tempPassword });
      await loadUsers();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function toggleStatus(user) {
    const status = user.status === "ativo" ? "inativo" : "ativo";
    await api.patch(`/users/${user.id}`, { status });
    await loadUsers();
  }

  async function changeRole(user, role) {
    await api.patch(`/users/${user.id}`, { role });
    await loadUsers();
  }

  async function handleResetPassword(e) {
    e.preventDefault();
    await api.post(`/users/${resetTarget.id}/reset-password`, { tempPassword: resetPassword });
    setResetTarget(null);
    setResetPassword("");
    await loadUsers();
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Usuários</h1>
          <p>Cadastro e permissões da equipe.</p>
        </div>
        <button className="btn" onClick={openNew}>
          + Novo usuário
        </button>
      </div>

      {error && <p className="negative-note">{error}</p>}

      <div className="card table-card">
        {loading ? (
          <p className="empty-state">Carregando usuários...</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Nome</th>
                <th>E-mail</th>
                <th>Perfil</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td>{u.name}</td>
                  <td>{u.email}</td>
                  <td>
                    <select className="input" value={u.role} onChange={(e) => changeRole(u, e.target.value)}>
                      {Object.entries(ROLE_LABEL).map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <span className={`badge ${u.status === "ativo" ? "badge-ok" : "badge-negative"}`}>
                      {u.status === "ativo" ? "Ativo" : "Inativo"}
                    </span>
                  </td>
                  <td>
                    <div className="inline-actions">
                      <button className="icon-btn" onClick={() => toggleStatus(u)}>
                        {u.status === "ativo" ? "Inativar" : "Ativar"}
                      </button>
                      <button
                        className="icon-btn"
                        onClick={() => {
                          setResetTarget(u);
                          setResetPassword(randomPassword());
                        }}
                      >
                        Redefinir senha
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {modalOpen && (
        <div className="modal-overlay" onClick={() => setModalOpen(false)}>
          <div className="card modal-card" onClick={(e) => e.stopPropagation()}>
            {createdInfo ? (
              <>
                <h2>Usuário criado</h2>
                <p>
                  Compartilhe a senha temporária abaixo com <strong>{createdInfo.email}</strong>. Ela será
                  obrigada a trocar a senha no primeiro acesso.
                </p>
                <div className="field">
                  <label>Senha temporária</label>
                  <input className="input" readOnly value={createdInfo.tempPassword} />
                </div>
                <div className="modal-actions">
                  <button className="btn" onClick={() => setModalOpen(false)}>
                    Concluir
                  </button>
                </div>
              </>
            ) : (
              <form onSubmit={handleCreate}>
                <h2>Novo usuário</h2>
                <div className="field">
                  <label>Nome</label>
                  <input
                    className="input"
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                  />
                </div>
                <div className="field">
                  <label>E-mail</label>
                  <input
                    className="input"
                    type="email"
                    required
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                  />
                </div>
                <div className="field">
                  <label>Perfil</label>
                  <select className="input" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
                    {Object.entries(ROLE_LABEL).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="field">
                  <label>Senha temporária</label>
                  <div style={{ display: "flex", gap: "0.5rem" }}>
                    <input
                      className="input"
                      value={form.tempPassword}
                      onChange={(e) => setForm({ ...form, tempPassword: e.target.value })}
                    />
                    <button
                      type="button"
                      className="btn-secondary btn"
                      onClick={() => setForm({ ...form, tempPassword: randomPassword() })}
                    >
                      Gerar
                    </button>
                  </div>
                </div>

                {formError && <p className="auth-error">{formError}</p>}

                <div className="modal-actions">
                  <button type="button" className="btn btn-secondary" onClick={() => setModalOpen(false)}>
                    Cancelar
                  </button>
                  <button type="submit" className="btn" disabled={saving}>
                    {saving ? "Criando..." : "Criar usuário"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {resetTarget && (
        <div className="modal-overlay" onClick={() => setResetTarget(null)}>
          <form className="card modal-card" onClick={(e) => e.stopPropagation()} onSubmit={handleResetPassword}>
            <h2>Redefinir senha</h2>
            <p>
              Nova senha temporária para <strong>{resetTarget.name}</strong>. O usuário será obrigado a trocá-la
              no próximo acesso.
            </p>
            <div className="field">
              <label>Senha temporária</label>
              <input className="input" value={resetPassword} onChange={(e) => setResetPassword(e.target.value)} />
            </div>
            <div className="modal-actions">
              <button type="button" className="btn btn-secondary" onClick={() => setResetTarget(null)}>
                Cancelar
              </button>
              <button type="submit" className="btn">
                Confirmar
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
