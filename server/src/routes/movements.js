import { Router } from "express";
import { requireRole } from "../middleware/auth.js";
import { supabaseAdmin } from "../supabaseAdmin.js";
import { checkLowStockCrossing } from "../lib/lowStock.js";

const router = Router();

router.get("/", async (req, res, next) => {
  try {
    let query = supabaseAdmin
      .from("movements")
      .select("*, item:items(id, name, unit)")
      .order("occurred_at", { ascending: false })
      .limit(Number(req.query.limit) || 200);

    if (req.query.itemId) query = query.eq("item_id", req.query.itemId);

    const { data, error } = await query;
    if (error) throw error;
    res.json(data);
  } catch (err) {
    next(err);
  }
});

// Admin e Operador de campo registram movimentações; Financeiro é somente leitura.
router.post("/", requireRole("admin", "operador"), async (req, res, next) => {
  try {
    const { itemId, type, quantity, reason, occurredAt, clientId } = req.body || {};

    if (!itemId || !["entrada", "saida"].includes(type)) {
      return res.status(400).json({ error: "Item e tipo (entrada/saída) são obrigatórios." });
    }
    const qty = Number(quantity);
    if (!qty || qty <= 0) {
      return res.status(400).json({ error: "Quantidade deve ser maior que zero." });
    }
    if (!reason?.trim()) {
      return res.status(400).json({ error: "Motivo/observação é obrigatório." });
    }

    const { data, error } = await supabaseAdmin.rpc("fn_register_movement", {
      p_item_id: itemId,
      p_type: type,
      p_quantity: qty,
      p_reason: reason.trim(),
      p_user_id: req.profile.id,
      p_user_name: req.profile.name,
      p_client_id: clientId || null,
      p_occurred_at: occurredAt || new Date().toISOString(),
    });
    if (error) {
      if (error.message?.includes("item_not_found")) {
        return res.status(404).json({ error: "Item não encontrado." });
      }
      throw error;
    }

    const result = data[0];

    if (result.is_new) {
      await checkLowStockCrossing({
        itemId: result.item_id,
        itemName: result.item_name,
        oldQuantity: Number(result.old_quantity),
        newQuantity: Number(result.new_quantity),
        minQuantity: Number(result.min_quantity),
      });
    }

    res.status(201).json({
      id: result.movement_id,
      itemId: result.item_id,
      itemName: result.item_name,
      quantity: qty,
      type,
      resultingQuantity: result.new_quantity,
      isNegative: Number(result.new_quantity) < 0,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
