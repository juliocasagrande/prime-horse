import webpush from "web-push";
import { env } from "../env.js";
import { supabaseAdmin } from "../supabaseAdmin.js";

export const pushEnabled = Boolean(env.vapidPublicKey && env.vapidPrivateKey);

if (pushEnabled) {
  webpush.setVapidDetails(env.vapidContactEmail, env.vapidPublicKey, env.vapidPrivateKey);
}

// Envia uma notificação push para todas as subscriptions cadastradas
// (toda a equipe é avisada, independente do perfil). Remove subscriptions
// mortas (410/404) automaticamente.
export async function broadcastPush(payload) {
  if (!pushEnabled) return;

  const { data: subscriptions, error } = await supabaseAdmin
    .from("push_subscriptions")
    .select("id, endpoint, p256dh, auth");

  if (error || !subscriptions?.length) return;

  const body = JSON.stringify(payload);

  await Promise.all(
    subscriptions.map(async (sub) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
          },
          body
        );
      } catch (err) {
        if (err.statusCode === 404 || err.statusCode === 410) {
          await supabaseAdmin.from("push_subscriptions").delete().eq("id", sub.id);
        }
      }
    })
  );
}
