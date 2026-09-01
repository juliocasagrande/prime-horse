import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import { api } from "../lib/api";
import { useAuth } from "../contexts/AuthContext";
import { SetPasswordForm } from "../components/SetPasswordForm";
import "./auth.css";

export default function FirstAccess() {
  const navigate = useNavigate();
  const { refreshProfile } = useAuth();

  async function handleSubmit(password) {
    const { error } = await supabase.auth.updateUser({ password });
    if (error) throw error;
    await api.post("/auth/complete-first-login");
    await refreshProfile();
    navigate("/");
  }

  return (
    <div className="auth-screen">
      <SetPasswordForm
        title="Primeiro acesso"
        subtitle="Por segurança, defina sua própria senha antes de continuar."
        submitLabel="Confirmar e entrar"
        onSubmit={handleSubmit}
      />
    </div>
  );
}
