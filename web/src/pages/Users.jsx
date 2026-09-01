import { useCallback, useEffect, useState } from "react";
import { api } from "../lib/api";
import { CustomSelect } from "../components/CustomSelect";
import { ConfirmModal, Modal } from "../components/Modal";
import { Wizard } from "../components/Wizard";
import { Toast } from "../components/Toast";
import { Icon } from "../components/Icons";
import "./pages.css";

const ROLE_LABEL = { admin: "Administrador", operador: "Operador de campo", financeiro: "Financeiro" };
const ROLE_DESCRIPTION = {
  admin: "Acesso total a itens, movimentações, usuários e configurações.",
  operador: "Registra entradas e saídas e consulta o estoque.",
  financeiro: "Consulta todas as informações sem alterar dados.",
};
const roleOptions = Object.entries(ROLE_LABEL).map(([value, label]) => ({ value, label }));
const steps = ["Dados", "Perfil", "Revisão"];

function randomPassword() {
  return "PH-" + Math.random().toString(36).slice(2, 8).toUpperCase() + Math.floor(Math.random() * 100);
}

export default function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [wizardOpen, setWizardOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({ name: "", email: "", role: "operador", tempPassword: randomPassword() });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [statusTarget, setStatusTarget] = useState(null);
  const [resetTarget, setResetTarget] = useState(null);
  const [resetPassword, setResetPassword] = useState("");
  const [toast, setToast] = useState("");
  const closeToast = useCallback(() => setToast(""), []);

  async function loadUsers() {
    setLoading(true); setError("");
    try { setUsers(await api.get("/users")); }
    catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }
  useEffect(() => { loadUsers(); }, []);

  function openNew() {
    setForm({ name: "", email: "", role: "operador", tempPassword: randomPassword() });
    setFormError(""); setStep(0); setWizardOpen(true);
  }

  function stepValid() {
    if (step === 0) return Boolean(form.name.trim() && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim()));
    if (step === 1) return Boolean(form.role);
    return true;
  }

  async function nextStep() {
    if (!stepValid()) return;
    if (step < steps.length - 1) { setStep((current) => current + 1); return; }
    setSaving(true); setFormError("");
    try {
      await api.post("/users", form);
      setWizardOpen(false); setToast("Usuário criado com sucesso."); await loadUsers();
    } catch (err) { setFormError(err.message); }
    finally { setSaving(false); }
  }

  async function changeRole(user, role) {
    try {
      await api.patch("/users/" + user.id, { role });
      setUsers((current) => current.map((item) => item.id === user.id ? { ...item, role } : item));
      setToast("Perfil atualizado com sucesso.");
    } catch (err) { setError(err.message); }
  }

  async function confirmStatus() {
    const status = statusTarget.status === "ativo" ? "inativo" : "ativo";
    setSaving(true);
    try {
      await api.patch("/users/" + statusTarget.id, { status });
      setStatusTarget(null); setToast(status === "ativo" ? "Usuário ativado com sucesso." : "Usuário inativado com sucesso.");
      await loadUsers();
    } catch (err) { setError(err.message); }
    finally { setSaving(false); }
  }

  async function resetUserPassword(event) {
    event.preventDefault();
    if (!resetPassword) return;
    setSaving(true);
    try {
      await api.post("/users/" + resetTarget.id + "/reset-password", { tempPassword: resetPassword });
      setResetTarget(null); setResetPassword(""); setToast("Senha redefinida. O usuário deverá trocá-la no próximo acesso.");
      await loadUsers();
    } catch (err) { setError(err.message); }
    finally { setSaving(false); }
  }

  function renderStep() {
    if (step === 0) return (
      <>
        <h3 className="wizard-section-title">Informe os dados do usuário</h3>
        <div className="field"><label>Nome completo</label><input className="input" autoFocus value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="Nome e sobrenome" /></div>
        <div className="field"><label>E-mail corporativo</label><input className="input" type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} placeholder="nome@primehorse.com" /></div>
      </>
    );
    if (step === 1) return (
      <>
        <h3 className="wizard-section-title">Escolha o perfil de acesso</h3>
        <div className="role-options">
          {Object.keys(ROLE_LABEL).map((role) => (
            <button type="button" key={role} className={"role-card " + (form.role === role ? "selected" : "")} onClick={() => setForm({ ...form, role })}>
              <span className="role-radio" /><span><strong>{ROLE_LABEL[role]}</strong><small>{ROLE_DESCRIPTION[role]}</small></span>
            </button>
          ))}
        </div>
      </>
    );
    return (
      <>
        <h3 className="wizard-section-title">Revise os dados de acesso</h3>
        <dl className="review-list">
          <div className="review-row"><dt>Nome</dt><dd>{form.name}</dd></div>
          <div className="review-row"><dt>E-mail</dt><dd>{form.email}</dd></div>
          <div className="review-row"><dt>Perfil</dt><dd>{ROLE_LABEL[form.role]}</dd></div>
        </dl>
        <div className="field" style={{ marginTop: 14 }}><label>Senha temporária gerada</label><div className="temporary-password">{form.tempPassword}</div><span className="field-hint">Compartilhe esta senha com segurança. A troca será obrigatória no primeiro acesso.</span></div>
        {formError && <p className="auth-error">{formError}</p>}
      </>
    );
  }

  return (
    <div className="page">
      <div className="page-header">
        <div className="page-header-copy"><h1>Usuários</h1><p>Gerencie os acessos e as permissões da equipe Prime Horse.</p></div>
        <div className="page-header-actions"><button className="btn" onClick={openNew}><Icon name="plus" size={17} /> Novo usuário</button></div>
      </div>
      {error && <p className="negative-note"><Icon name="alert" size={17} />{error}</p>}
      <div className="card table-card">
        {loading ? <p className="empty-state">Carregando usuários...</p> : (
          <table>
            <thead><tr><th>Nome</th><th>E-mail</th><th>Perfil</th><th>Status</th><th>Ações</th></tr></thead>
            <tbody>{users.map((user) => (
              <tr key={user.id}>
                <td className="table-primary">{user.name}</td><td>{user.email}</td>
                <td style={{ minWidth: 190 }}><CustomSelect value={user.role} onChange={(role) => changeRole(user, role)} options={roleOptions} ariaLabel={"Perfil de " + user.name} /></td>
                <td><span className={"badge " + (user.status === "ativo" ? "badge-ok" : "badge-negative")}>{user.status === "ativo" ? "Ativo" : "Inativo"}</span></td>
                <td><div className="inline-actions">
                  <button className="icon-btn" onClick={() => setStatusTarget(user)}>{user.status === "ativo" ? "Inativar" : "Ativar"}</button>
                  <button className="icon-btn" onClick={() => { setResetTarget(user); setResetPassword(randomPassword()); }}><Icon name="refresh" size={14} /> Redefinir senha</button>
                </div></td>
              </tr>
            ))}</tbody>
          </table>
        )}
      </div>
      {wizardOpen && <Wizard title="Novo usuário" steps={steps} step={step} onClose={() => setWizardOpen(false)} onBack={() => setStep((current) => current - 1)} onNext={nextStep} nextLabel={step === 2 ? "Criar usuário" : "Continuar"} nextDisabled={!stepValid()} saving={saving}>{renderStep()}</Wizard>}
      {statusTarget && <ConfirmModal title={statusTarget.status === "ativo" ? "Inativar usuário" : "Ativar usuário"} message={(statusTarget.status === "ativo" ? "O usuário perderá o acesso até ser ativado novamente. " : "O usuário voltará a ter acesso ao sistema. ") + "Deseja continuar com " + statusTarget.name + "?"} confirmLabel={statusTarget.status === "ativo" ? "Inativar" : "Ativar"} danger={statusTarget.status === "ativo"} busy={saving} onCancel={() => setStatusTarget(null)} onConfirm={confirmStatus} />}
      {resetTarget && <Modal title="Redefinir senha" onClose={() => setResetTarget(null)} actions={<><button type="button" className="btn btn-secondary" onClick={() => setResetTarget(null)}>Cancelar</button><button type="submit" form="reset-password-form" className="btn" disabled={saving || !resetPassword}>{saving ? "Aguarde..." : "Confirmar redefinição"}</button></>}>
        <form id="reset-password-form" onSubmit={resetUserPassword}>
          <p className="modal-message">Esta será a nova senha temporária de <strong>{resetTarget.name}</strong>. A troca será obrigatória no próximo acesso.</p>
          <div className="field"><label>Senha temporária</label><div style={{ display: "flex", gap: 7 }}><input className="input" value={resetPassword} onChange={(event) => setResetPassword(event.target.value)} /><button type="button" className="btn btn-secondary" onClick={() => setResetPassword(randomPassword())}>Gerar</button></div></div>
        </form>
      </Modal>}
      {toast && <Toast message={toast} onClose={closeToast} />}
    </div>
  );
}
