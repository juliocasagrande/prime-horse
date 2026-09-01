import { supabaseAdmin } from "../supabaseAdmin.js";

// Verifica o JWT do Supabase enviado pelo frontend e carrega o profile
// (nome, perfil/role, status) para as rotas decidirem permissão.
export async function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;
    if (!token) {
      return res.status(401).json({ error: "Token de autenticação ausente." });
    }

    const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(token);
    if (userError || !userData?.user) {
      return res.status(401).json({ error: "Sessão inválida ou expirada." });
    }

    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("id, name, email, role, status, must_change_password")
      .eq("id", userData.user.id)
      .single();

    if (profileError || !profile) {
      return res.status(403).json({ error: "Usuário sem cadastro de perfil no sistema." });
    }

    if (profile.status === "inativo") {
      return res.status(403).json({ error: "Usuário inativo. Contate o administrador." });
    }

    req.user = userData.user;
    req.profile = profile;
    next();
  } catch (err) {
    next(err);
  }
}

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.profile || !roles.includes(req.profile.role)) {
      return res.status(403).json({ error: "Sem permissão para esta ação." });
    }
    next();
  };
}
