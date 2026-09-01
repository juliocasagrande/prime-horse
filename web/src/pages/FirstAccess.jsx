import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Wizard } from "../components/Wizard";
import { Icon } from "../components/Icons";
import { Brand } from "../components/Brand";
import { supabase } from "../lib/supabaseClient";
import { api } from "../lib/api";
import { useAuth } from "../contexts/AuthContext";
import "./auth.css";
import "./pages.css";

export default function FirstAccess() {
  const navigate = useNavigate();
  const { refreshProfile } = useAuth();
  const [step, setStep] = useState(0);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const valid = password.length >= 6 && password === confirm;

  async function next() {
    if (step === 1) {
      navigate("/");
      return;
    }
    if (!valid) return;
    setError("");
    setSaving(true);
    try {
      const { error: authError } = await supabase.auth.updateUser({ password });
      if (authError) throw authError;
      await api.post("/auth/complete-first-login");
      await refreshProfile();
      setStep(1);
    } catch (err) {
      setError(err.message || "Não foi possível atualizar a senha.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="first-access-page">
      <div className="first-access-preview">
        <aside><Brand compact inverse /></aside>
        <main><div className="first-access-skeleton" /><div className="first-access-skeleton wide" /></main>
      </div>
      <Wizard
        title="Primeiro acesso"
        steps={["Nova senha", "Concluído"]}
        step={step}
        closeable={false}
        onBack={() => setStep(0)}
        onNext={next}
        nextLabel={step === 0 ? "Confirmar senha" : "Ir para o painel"}
        nextDisabled={step === 0 && !valid}
        saving={saving}
      >
        {step === 0 ? (
          <>
            <h3 className="wizard-section-title">Crie sua senha definitiva</h3>
            <p className="first-access-copy">Por segurança, troque a senha temporária antes de continuar.</p>
            <div className="field">
              <label htmlFor="first-password">Nova senha</label>
              <input id="first-password" className="input" type="password" autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} />
              <span className="field-hint">Use pelo menos 6 caracteres.</span>
            </div>
            <div className="field">
              <label htmlFor="first-confirm">Confirmar nova senha</label>
              <input id="first-confirm" className="input" type="password" autoComplete="new-password" value={confirm} onChange={(event) => setConfirm(event.target.value)} />
            </div>
            {confirm && password !== confirm && <p className="auth-error">As senhas não coincidem.</p>}
            {error && <p className="auth-error">{error}</p>}
          </>
        ) : (
          <div className="success-panel">
            <div className="success-panel-icon"><Icon name="check" size={30} /></div>
            <h3>Senha atualizada com sucesso</h3>
            <p>Seu acesso está pronto. A partir de agora, use a nova senha para entrar no Prime Horse.</p>
          </div>
        )}
      </Wizard>
    </div>
  );
}
