import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import { SetPasswordForm } from "../components/SetPasswordForm";
import "./auth.css";

export default function ResetPassword() {
  const navigate = useNavigate();

  async function handleSubmit(password) {
    const { error } = await supabase.auth.updateUser({ password });
    if (error) throw error;
    navigate("/");
  }

  return (
    <div className="auth-screen">
      <SetPasswordForm
        title="Definir nova senha"
        subtitle="Escolha uma nova senha para sua conta."
        submitLabel="Salvar nova senha"
        onSubmit={handleSubmit}
      />
    </div>
  );
}
