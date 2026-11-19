import { AsyncLocalStorage } from "async_hooks";

type Entry = { value: unknown; expiresAt: number };
type Counters = { acces: number; defauts: number };
type RunStore = { entries: Map<string, Entry>; counters: Map<string, Counters> };

export type RunCacheStats = Record<string, Counters & { tauxDefaut: number }>;

const storage = new AsyncLocalStorage<RunStore>();

const DEFAULT_TTL_MS = 5 * 60_000;

/**
 * Ouvre un cache valable pour la durée de `fn` et de tout ce qu'elle déclenche.
 * Hors de ce contexte, `cachedInRun` appelle toujours `load` : le serveur HTTP et les autres jobs ne sont pas touchés.
 */
export const withRunCache = <T>(fn: () => Promise<T>): Promise<T> =>
  storage.run({ entries: new Map(), counters: new Map() }, fn);

const prefixOf = (key: string) => {
  const separator = key.indexOf(":");
  return separator === -1 ? key : key.slice(0, separator);
};

/** Un résultat `null` n'est jamais mémorisé : une absence peut cesser d'être vraie pendant le run. */
export async function cachedInRun<T>(
  key: string,
  load: () => Promise<T>,
  { ttlMs = DEFAULT_TTL_MS }: { ttlMs?: number } = {}
): Promise<T> {
  const store = storage.getStore();
  if (!store) {
    return load();
  }

  const prefix = prefixOf(key);
  const counters = store.counters.get(prefix) ?? { acces: 0, defauts: 0 };
  store.counters.set(prefix, counters);
  counters.acces++;

  const hit = store.entries.get(key);
  if (hit && hit.expiresAt > Date.now()) {
    return hit.value as T;
  }

  counters.defauts++;
  const value = await load();
  if (value !== null) {
    store.entries.set(key, { value, expiresAt: Date.now() + ttlMs });
  }
  return value;
}

/** Accès et défauts du run courant par préfixe de clé, ou `null` hors d'un run. */
export function getRunCacheStats(): RunCacheStats | null {
  const store = storage.getStore();
  if (!store) {
    return null;
  }

  return Object.fromEntries(
    [...store.counters].map(([prefix, { acces, defauts }]) => [
      prefix,
      { acces, defauts, tauxDefaut: Math.round((defauts / acces) * 10_000) / 10_000 },
    ])
  );
}
