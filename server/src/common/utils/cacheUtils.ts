import logger from "@/common/logger";

let cache: { [key: string]: Promise<unknown> } = {};

/**
 * Met en cache le résultat d'une fonction pendant `expiration` ms. Un échec n'est pas conservé :
 * l'appel suivant recalcule.
 */
export async function tryCachedExecution<T>(
  cacheKey: string,
  expiration: number,
  serviceFunc: () => Promise<T>
): Promise<T> {
  let cachedResult = cache[cacheKey] as Promise<T> | undefined;
  if (!cachedResult) {
    logger.debug({ cacheKey, expiration }, "set cache");
    cachedResult = cache[cacheKey] = serviceFunc().catch((err) => {
      if (cache[cacheKey] === cachedResult) {
        delete cache[cacheKey];
      }
      throw err;
    });

    setTimeout(() => {
      logger.debug({ cacheKey, expiration }, "clear cache");
      if (cache[cacheKey] === cachedResult) {
        delete cache[cacheKey];
      }
    }, expiration).unref();
  }
  return await cachedResult;
}

/**
 * Vide toutes les entrées du cache.
 */
export function clearCache() {
  cache = {};
}
