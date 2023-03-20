import { stringify } from "safe-stable-stringify";

/**
 * It takes a route and a set of filters and returns a string that uniquely identifies the route and
 * filters
 * @param route - The route that we want to cache.
 * @param filters - an object containing the filters that are applied to the route
 * @returns A string that is the route and the filters.
 */

export const getCacheKeyForRoute = (route, filters) => {
  // we use json-stringify-deterministic to make sure that {a: 1, b: 2} stringified is the same as {b: 2, a: 1}
  return `${route}:${stringify(filters)}`;
};

// would be simpler to put this helper function into the cache structure
export async function tryCachedExecution(cache: any, cacheKey: string, serviceFunc: () => Promise<any> | any) {
  const cachedResult = await cache.get(cacheKey);
  if (cachedResult) {
    return JSON.parse(cachedResult);
  } else {
    const result = await serviceFunc();
    await cache.set(cacheKey, JSON.stringify(result));
    return result;
  }
}
