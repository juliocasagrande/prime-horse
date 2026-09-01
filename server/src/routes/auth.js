import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { supabaseAdmin } from "../supabaseAdmin.js";

const router = Router();

router.get("/me", requireAuth, (req, res) => {
  res.json({ profile: req.profile });
});

// Chamado pelo frontend depois que o usuário troca a senha temporária pela
// própria (supabase.auth.updateUser), para liberar o uso normal do sistema.
router.post("/complete-first-login", requireAuth, async (req, res, next) => {
  try {
    const { error } = await supabaseAdmin
      .from("profiles")
      .update({ must_change_password: false })
      .eq("id", req.profile.id);
    if (error) throw error;
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

export default router;
