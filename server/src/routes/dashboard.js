import { Router } from "express";
import { supabaseAdmin } from "../supabaseAdmin.js";

const router = Router();

router.get("/summary", async (req, res, next) => {
  try {
    const [itemsRes, usersRes, movementsRes] = await Promise.all([
      supabaseAdmin.from("items").select("id, name, current_quantity, min_quantity, unit"),
      supabaseAdmin.from("profiles").select("id", { count: "exact", head: true }).eq("status", "ativo"),
      supabaseAdmin
        .from("movements")
        .select("*, item:items(id, name, unit)")
        .order("occurred_at", { ascending: false })
        .limit(10),
    ]);

    if (itemsRes.error) throw itemsRes.error;
    if (usersRes.error) throw usersRes.error;
    if (movementsRes.error) throw movementsRes.error;

    const items = itemsRes.data;
    const lowStockItems = items.filter((i) => i.current_quantity <= i.min_quantity);
    const negativeItems = items.filter((i) => i.current_quantity < 0);

    res.json({
      totalItems: items.length,
      activeUsers: usersRes.count || 0,
      lowStockCount: lowStockItems.length,
      negativeCount: negativeItems.length,
      lowStockItems: lowStockItems.slice(0, 10),
      recentMovements: movementsRes.data,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
