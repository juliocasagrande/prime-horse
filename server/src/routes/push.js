import { Router } from "express";
import { supabaseAdmin } from "../supabaseAdmin.js";
import { env } from "../env.js";
import { pushEnabled } from "../lib/webpush.js";

const router = Router();

router.get("/vapid-public-key", (req, res) => {
  res.json({ publicKey: pushEnabled ? env.vapidPublicKey : null });
});

router.post("/subscribe", async (req, res, next) => {
  try {
    const { endpoint, keys } = req.body?.subscription || req.body || {};
    if (!endpoint || !keys?.p256dh || !keys?.auth) {
      return res.status(400).json({ error: "Subscription inválida." });
    }

    const { error } = await supabaseAdmin.from("push_subscriptions").upsert(
      {
        user_id: req.profile.id,
        endpoint,
        p256dh: keys.p256dh,
        auth: keys.auth,
      },
      { onConflict: "endpoint" }
    );
    if (error) throw error;
    res.status(201).json({ ok: true });
  } catch (err) {
    next(err);
  }
});

router.post("/unsubscribe", async (req, res, next) => {
  try {
    const { endpoint } = req.body || {};
    if (!endpoint) return res.status(400).json({ error: "Endpoint é obrigatório." });
    const { error } = await supabaseAdmin
      .from("push_subscriptions")
      .delete()
      .eq("endpoint", endpoint)
      .eq("user_id", req.profile.id);
    if (error) throw error;
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

export default router;
