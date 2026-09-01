import { Router } from "express";
import { supabaseAdmin } from "../supabaseAdmin.js";
import { requireRole } from "../middleware/auth.js";

// Categorias, locais e unidades têm exatamente a mesma forma (lista aberta,
// { id, name }, leitura para todos os perfis autenticados e escrita só admin).
export function simpleResourceRouter(table) {
  const router = Router();

  router.get("/", async (req, res, next) => {
    try {
      const { data, error } = await supabaseAdmin.from(table).select("*").order("name");
      if (error) throw error;
      res.json(data);
    } catch (err) {
      next(err);
    }
  });

  router.post("/", requireRole("admin"), async (req, res, next) => {
    try {
      const name = (req.body?.name || "").trim();
      if (!name) return res.status(400).json({ error: "Nome é obrigatório." });
      const { data, error } = await supabaseAdmin.from(table).insert({ name }).select().single();
      if (error) throw error;
      res.status(201).json(data);
    } catch (err) {
      next(err);
    }
  });

  router.patch("/:id", requireRole("admin"), async (req, res, next) => {
    try {
      const name = (req.body?.name || "").trim();
      if (!name) return res.status(400).json({ error: "Nome é obrigatório." });
      const { data, error } = await supabaseAdmin
        .from(table)
        .update({ name })
        .eq("id", req.params.id)
        .select()
        .single();
      if (error) throw error;
      res.json(data);
    } catch (err) {
      next(err);
    }
  });

  router.delete("/:id", requireRole("admin"), async (req, res, next) => {
    try {
      const { error } = await supabaseAdmin.from(table).delete().eq("id", req.params.id);
      if (error) throw error;
      res.status(204).end();
    } catch (err) {
      next(err);
    }
  });

  return router;
}
