import logger from "@/common/logger";

let cache: { [key: string]: Promise<any> } = {};

/**
 * Met en cache le résultat d'une fonction.
 */
export async function tryCachedExecution<T>(
  cacheKey: string,
  expiration: number,
  serviceFunc: () => Promise<T>
): Promise<T> {
  let cachedResult: Promise<T> = cache[cacheKey];
  if (!cachedResult) {
    logger.debug({ cacheKey, expiration }, "set cache");
    cachedResult = cache[cacheKey] = serviceFunc();

    // invalidate the cache after some time
    setTimeout(() => {
      logger.debug({ cacheKey, expiration }, "clear cache");
      delete cache[cacheKey];
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
