import { useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import "./auth.css";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/redefinir-senha`,
    });
    setLoading(false);
    if (error) {
      setError("Não foi possível enviar o e-mail de recuperação.");
      return;
    }
    setSent(true);
  }

  return (
    <div className="auth-screen">
      <form className="card auth-card" onSubmit={handleSubmit}>
        <h1>Recuperar senha</h1>
        <p className="auth-subtitle">Enviaremos um link de recuperação por e-mail.</p>

        <div className="field">
          <label htmlFor="email">E-mail</label>
          <input
            id="email"
            className="input"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        {error && <p className="auth-error">{error}</p>}
        {sent && <p className="auth-success">E-mail enviado. Verifique sua caixa de entrada.</p>}

        <button className="btn" type="submit" disabled={loading}>
          {loading ? "Enviando..." : "Enviar link de recuperação"}
        </button>

        <Link className="auth-link" to="/login">
          Voltar para o login
        </Link>
      </form>
    </div>
  );
}
