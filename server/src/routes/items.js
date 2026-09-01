import { Router } from "express";
import { requireRole } from "../middleware/auth.js";
import { supabaseAdmin } from "../supabaseAdmin.js";
import { checkLowStockCrossing } from "../lib/lowStock.js";

const router = Router();

function withStatus(item) {
  let status = "ok";
  if (item.current_quantity < 0) status = "negative";
  else if (item.current_quantity <= item.min_quantity) status = "low";
  return { ...item, status };
}

router.get("/", async (req, res, next) => {
  try {
    const { data, error } = await supabaseAdmin
      .from("items")
      .select("*, category:categories(id, name), location:locations(id, name)")
      .order("name");
    if (error) throw error;
    res.json(data.map(withStatus));
  } catch (err) {
    next(err);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const { data, error } = await supabaseAdmin
      .from("items")
      .select("*, category:categories(id, name), location:locations(id, name)")
      .eq("id", req.params.id)
      .single();
    if (error) throw error;
    res.json(withStatus(data));
  } catch (err) {
    next(err);
  }
});

function readItemPayload(body) {
  const {
    name,
    categoryId,
    locationId,
    unit,
    currentQuantity,
    minQuantity,
    expiryDate,
    supplier,
    costPrice,
  } = body || {};
  return {
    name: name?.trim(),
    category_id: categoryId === undefined ? undefined : categoryId || null,
    location_id: locationId === undefined ? undefined : locationId || null,
    unit: unit?.trim(),
    current_quantity: currentQuantity === undefined ? undefined : Number(currentQuantity),
    min_quantity: minQuantity === undefined ? undefined : Number(minQuantity),
    expiry_date: expiryDate === undefined ? undefined : expiryDate || null,
    supplier: supplier === undefined ? undefined : supplier?.trim() || null,
    cost_price: costPrice === undefined ? undefined : costPrice === "" ? null : Number(costPrice),
  };
}

router.post("/", requireRole("admin"), async (req, res, next) => {
  try {
    const payload = readItemPayload(req.body);
    if (!payload.name || !payload.unit) {
      return res.status(400).json({ error: "Nome e unidade de medida são obrigatórios." });
    }
    payload.current_quantity = payload.current_quantity ?? 0;
    payload.min_quantity = payload.min_quantity ?? 0;
    const { data, error } = await supabaseAdmin.from("items").insert(payload).select().single();
    if (error) throw error;
    res.status(201).json(withStatus(data));
  } catch (err) {
    next(err);
  }
});

router.patch("/:id", requireRole("admin"), async (req, res, next) => {
  try {
    const { data: before, error: beforeError } = await supabaseAdmin
      .from("items")
      .select("current_quantity, min_quantity, name")
      .eq("id", req.params.id)
      .single();
    if (beforeError) throw beforeError;

    const payload = readItemPayload(req.body);
    const { data, error } = await supabaseAdmin
      .from("items")
      .update(payload)
      .eq("id", req.params.id)
      .select()
      .single();
    if (error) throw error;

    await checkLowStockCrossing({
      itemId: data.id,
      itemName: data.name,
      oldQuantity: Number(before.current_quantity),
      newQuantity: Number(data.current_quantity),
      minQuantity: Number(data.min_quantity),
    });

    res.json(withStatus(data));
  } catch (err) {
    next(err);
  }
});

router.delete("/:id", requireRole("admin"), async (req, res, next) => {
  try {
    const { error } = await supabaseAdmin.from("items").delete().eq("id", req.params.id);
    if (error) throw error;
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

export default router;
