import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { Brand } from "../components/Brand";
import { Icon } from "../components/Icons";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../contexts/AuthContext";
import "./auth.css";

export default function Login() {
  const { session } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (session) return <Navigate to="/" replace />;

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setLoading(true);
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (authError) {
      setError("E-mail ou senha inválidos.");
      return;
    }
    navigate("/");
  }

  return (
    <div className="login-screen">
      <aside className="login-brand-panel">
        <div className="login-brand-glow" />
        <Brand inverse />
        <div className="login-brand-content">
          <h1>Controle total do seu estoque, em um só painel.</h1>
          <ul className="login-highlights">
            <li><span><Icon name="check" size={14} /></span>Alertas automáticos de estoque baixo</li>
            <li><span><Icon name="check" size={14} /></span>Histórico completo de entradas e saídas</li>
            <li><span><Icon name="check" size={14} /></span>Permissões por perfil de usuário</li>
          </ul>
        </div>
        <small>© {new Date().getFullYear()} Prime Horse</small>
      </aside>
      <main className="login-form-panel">
        <form className="login-form" onSubmit={handleSubmit}>
          <div className="auth-heading">
            <h1>Entrar</h1>
            <p className="auth-subtitle">Acesse com seu e-mail e senha corporativos.</p>
          </div>
          <div className="field">
            <label htmlFor="email">E-mail</label>
            <input id="email" className="input" type="email" autoComplete="email" placeholder="nome@primehorse.com" required value={email} onChange={(event) => setEmail(event.target.value)} />
          </div>
          <div className="field auth-password-field">
            <label htmlFor="password">Senha</label>
            <input id="password" className="input" type="password" autoComplete="current-password" placeholder="••••••••" required value={password} onChange={(event) => setPassword(event.target.value)} />
          </div>
          <Link className="auth-forgot-link" to="/esqueci-senha">Esqueci minha senha</Link>
          {error && <p className="auth-error">{error}</p>}
          <button className="btn auth-submit" type="submit" disabled={loading || !email || !password}>
            {loading ? "Entrando..." : "Entrar"}
          </button>
        </form>
      </main>
    </div>
  );
}
