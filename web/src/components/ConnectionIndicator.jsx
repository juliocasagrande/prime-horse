import { useEffect, useState } from "react";
import { useOnlineStatus } from "../lib/useOnlineStatus";
import { flushQueuedMovements, listQueuedMovements } from "../lib/offlineQueue";

export function ConnectionIndicator() {
  const online = useOnlineStatus();
  const [pending, setPending] = useState(0);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function refreshPending() {
      const items = await listQueuedMovements();
      if (!cancelled) setPending(items.length);
    }

    refreshPending();

    async function sync() {
      if (!online) return;
      setSyncing(true);
      await flushQueuedMovements();
      await refreshPending();
      setSyncing(false);
    }

    sync();
    const interval = setInterval(refreshPending, 4000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [online]);

  let label = "Online";
  let className = "connection-badge online";
  if (!online) {
    label = pending > 0 ? `Offline · ${pending} pendente(s)` : "Offline";
    className = "connection-badge offline";
  } else if (syncing && pending > 0) {
    label = "Sincronizando...";
    className = "connection-badge syncing";
  }

  return <span className={className}>{label}</span>;
}
