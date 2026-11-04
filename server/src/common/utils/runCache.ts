import { AsyncLocalStorage } from "async_hooks";

type Entry = { value: unknown; expiresAt: number };

const storage = new AsyncLocalStorage<Map<string, Entry>>();

const DEFAULT_TTL_MS = 5 * 60_000;

/**
 * Ouvre un cache valable pour la durée de `fn` et de tout ce qu'elle déclenche.
 * Hors de ce contexte, `cachedInRun` appelle toujours `load` : le serveur HTTP et les autres jobs ne sont pas touchés.
 */
export const withRunCache = <T>(fn: () => Promise<T>): Promise<T> => storage.run(new Map(), fn);

/** Un résultat `null` n'est jamais mémorisé : une absence peut cesser d'être vraie pendant le run. */
export async function cachedInRun<T>(
  key: string,
  load: () => Promise<T>,
  { ttlMs = DEFAULT_TTL_MS }: { ttlMs?: number } = {}
): Promise<T> {
  const cache = storage.getStore();
  if (!cache) {
    return load();
  }

  const hit = cache.get(key);
  if (hit && hit.expiresAt > Date.now()) {
    return hit.value as T;
  }

  const value = await load();
  if (value !== null) {
    cache.set(key, { value, expiresAt: Date.now() + ttlMs });
  }
  return value;
}
