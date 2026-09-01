import { Router } from "express";
import { requireRole } from "../middleware/auth.js";
import { supabaseAdmin } from "../supabaseAdmin.js";

const router = Router();

// Todas as rotas de usuários são exclusivas do Administrador.
router.use(requireRole("admin"));

router.get("/", async (req, res, next) => {
  try {
    const { data, error } = await supabaseAdmin
      .from("profiles")
      .select("id, name, email, role, status, must_change_password, created_at")
      .order("name");
    if (error) throw error;
    res.json(data);
  } catch (err) {
    next(err);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const { name, email, role, tempPassword } = req.body || {};
    if (!name?.trim() || !email?.trim() || !role || !tempPassword) {
      return res.status(400).json({ error: "Nome, e-mail, perfil e senha temporária são obrigatórios." });
    }
    if (!["admin", "operador", "financeiro"].includes(role)) {
      return res.status(400).json({ error: "Perfil inválido." });
    }

    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email: email.trim(),
      password: tempPassword,
      email_confirm: true,
      user_metadata: { name: name.trim(), role },
    });
    if (error) return res.status(400).json({ error: error.message });

    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("id, name, email, role, status, must_change_password, created_at")
      .eq("id", data.user.id)
      .single();
    if (profileError) throw profileError;

    res.status(201).json(profile);
  } catch (err) {
    next(err);
  }
});

router.patch("/:id", async (req, res, next) => {
  try {
    const { name, role, status } = req.body || {};
    const patch = {};
    if (name !== undefined) patch.name = name.trim();
    if (role !== undefined) {
      if (!["admin", "operador", "financeiro"].includes(role)) {
        return res.status(400).json({ error: "Perfil inválido." });
      }
      patch.role = role;
    }
    if (status !== undefined) {
      if (!["ativo", "inativo"].includes(status)) {
        return res.status(400).json({ error: "Status inválido." });
      }
      patch.status = status;
    }

    const { data, error } = await supabaseAdmin
      .from("profiles")
      .update(patch)
      .eq("id", req.params.id)
      .select("id, name, email, role, status, must_change_password, created_at")
      .single();
    if (error) throw error;
    res.json(data);
  } catch (err) {
    next(err);
  }
});

router.post("/:id/reset-password", async (req, res, next) => {
  try {
    const { tempPassword } = req.body || {};
    if (!tempPassword) return res.status(400).json({ error: "Senha temporária é obrigatória." });

    const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(req.params.id, {
      password: tempPassword,
    });
    if (authError) return res.status(400).json({ error: authError.message });

    const { error } = await supabaseAdmin
      .from("profiles")
      .update({ must_change_password: true })
      .eq("id", req.params.id);
    if (error) throw error;

    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

export default router;
