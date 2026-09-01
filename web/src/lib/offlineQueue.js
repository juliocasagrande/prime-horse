import { openDB } from "idb";
import { api } from "./api";

const DB_NAME = "prime-horse-offline";
const STORE = "pending-movements";

const dbPromise = openDB(DB_NAME, 1, {
  upgrade(db) {
    db.createObjectStore(STORE, { keyPath: "clientId" });
  },
});

export async function queueMovement(movement) {
  const db = await dbPromise;
  const clientId = crypto.randomUUID();
  const record = { ...movement, clientId, queuedAt: new Date().toISOString() };
  await db.put(STORE, record);
  return record;
}

export async function listQueuedMovements() {
  const db = await dbPromise;
  return db.getAll(STORE);
}

export async function removeQueuedMovement(clientId) {
  const db = await dbPromise;
  await db.delete(STORE, clientId);
}

let flushing = false;

// Reenvia a fila local assim que a conexão volta. Erros de rede mantêm o
// item na fila para a próxima tentativa; erros de validação (4xx) são
// descartados, pois repetir não vai resolver.
export async function flushQueuedMovements(onChange) {
  if (flushing || !navigator.onLine) return;
  flushing = true;
  try {
    const pending = await listQueuedMovements();
    for (const movement of pending) {
      try {
        const { clientId, queuedAt, ...payload } = movement;
        await api.post("/movements", { ...payload, clientId });
        await removeQueuedMovement(movement.clientId);
        onChange?.();
      } catch (err) {
        if (err.isNetworkError) break;
        await removeQueuedMovement(movement.clientId);
        onChange?.(err);
      }
    }
  } finally {
    flushing = false;
  }
}
