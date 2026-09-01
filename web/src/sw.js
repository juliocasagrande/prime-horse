import { precacheAndRoute, cleanupOutdatedCaches } from "workbox-precaching";
import { registerRoute, NavigationRoute } from "workbox-routing";
import { NetworkFirst } from "workbox-strategies";
import { ExpirationPlugin } from "workbox-expiration";
import { CacheableResponsePlugin } from "workbox-cacheable-response";

self.skipWaiting();
cleanupOutdatedCaches();

// Precache do app shell (JS/CSS/HTML/ícones) — injetado no build pelo vite-plugin-pwa.
precacheAndRoute(self.__WB_MANIFEST);

// Navegação (rotas do React Router) cai no index.html cacheado quando offline.
registerRoute(new NavigationRoute(async (params) => {
  try {
    return await fetch(params.request);
  } catch {
    const cache = await caches.open("prime-horse-shell");
    return (await cache.match("/index.html")) || Response.error();
  }
}));

// Consulta ao estoque/config funciona offline com o último dado conhecido:
// tenta a rede, cai pro cache se offline (a fila de escrita fica no IndexedDB, ver offlineQueue.js).
registerRoute(
  ({ url, request }) => request.method === "GET" && url.pathname.startsWith("/api/"),
  new NetworkFirst({
    cacheName: "api-cache",
    networkTimeoutSeconds: 6,
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] }),
      new ExpirationPlugin({ maxEntries: 300, maxAgeSeconds: 60 * 60 * 24 * 7 }),
    ],
  })
);

// --- Web Push -----------------------------------------------------------
self.addEventListener("push", (event) => {
  let payload = { title: "Prime Horse", body: "Você tem uma nova notificação." };
  try {
    if (event.data) payload = { ...payload, ...event.data.json() };
  } catch {
    // ignore payload malformado
  }

  event.waitUntil(
    self.registration.showNotification(payload.title, {
      body: payload.body,
      icon: "/icons/icon-192.png",
      badge: "/icons/icon-192.png",
      data: { itemId: payload.itemId },
      tag: payload.itemId ? `low-stock-${payload.itemId}` : undefined,
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const target = "/notificacoes";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientsArr) => {
      const existing = clientsArr.find((c) => c.url.includes(self.location.origin));
      if (existing) {
        existing.focus();
        existing.navigate(target);
      } else {
        self.clients.openWindow(target);
      }
    })
  );
});
