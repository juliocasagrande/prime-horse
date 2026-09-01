import { Router } from "express";
import { supabaseAdmin } from "../supabaseAdmin.js";

const router = Router();

router.get("/", async (req, res, next) => {
  try {
    const { data, error } = await supabaseAdmin
      .from("notifications")
      .select("*, item:items(id, name)")
      .order("created_at", { ascending: false })
      .limit(Number(req.query.limit) || 100);
    if (error) throw error;
    res.json(data);
  } catch (err) {
    next(err);
  }
});

export default router;
