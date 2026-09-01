import { supabaseAdmin } from "../supabaseAdmin.js";
import { broadcastPush } from "./webpush.js";

// Dispara alerta (push + histórico) só no momento em que o item CRUZA para
// estoque baixo (não a cada movimentação enquanto já está baixo), conforme
// a regra de negócio da spec (seção 7).
export async function checkLowStockCrossing({ itemId, itemName, oldQuantity, newQuantity, minQuantity }) {
  const wasLow = oldQuantity <= minQuantity;
  const isLow = newQuantity <= minQuantity;

  if (!isLow || wasLow) return;

  const message = `${itemName} atingiu estoque baixo: ${newQuantity} (mínimo ${minQuantity}).`;

  await supabaseAdmin.from("notifications").insert({
    item_id: itemId,
    type: "low_stock",
    message,
  });

  await broadcastPush({
    title: "Estoque baixo — Prime Horse",
    body: message,
    itemId,
  });
}
