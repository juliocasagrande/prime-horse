import { useState } from "react";

export function SetPasswordForm({ title, subtitle, submitLabel, onSubmit }) {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (password.length < 8) {
      setError("A senha deve ter pelo menos 8 caracteres.");
      return;
    }
    if (password !== confirm) {
      setError("As senhas não coincidem.");
      return;
    }
    setLoading(true);
    try {
      await onSubmit(password);
    } catch (err) {
      setError(err.message || "Não foi possível atualizar a senha.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="card auth-card" onSubmit={handleSubmit}>
      <h1>{title}</h1>
      {subtitle && <p className="auth-subtitle">{subtitle}</p>}

      <div className="field">
        <label htmlFor="password">Nova senha</label>
        <input
          id="password"
          className="input"
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>

      <div className="field">
        <label htmlFor="confirm">Confirmar nova senha</label>
        <input
          id="confirm"
          className="input"
          type="password"
          required
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
        />
      </div>

      {error && <p className="auth-error">{error}</p>}

      <button className="btn" type="submit" disabled={loading}>
        {loading ? "Salvando..." : submitLabel}
      </button>
    </form>
  );
}
