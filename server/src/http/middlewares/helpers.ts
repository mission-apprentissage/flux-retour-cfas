import tryCatch from "./tryCatchMiddleware";

// catch errors and return the result of the request handler
export function returnResult(serviceFunc) {
  return tryCatch(async (req, res, next) => {
    const result = await serviceFunc(req, res, next);
    res.set("Content-Type", "application/json");
    res.send(result);
  });
}

// would be simpler to put this helper function into the cache structure
export async function tryCachedExecution(cache, cacheKey, serviceFunc) {
  const cachedResult = await cache.get(cacheKey);
  if (cachedResult) {
    return JSON.parse(cachedResult);
  } else {
    const result = await serviceFunc();
    await cache.set(cacheKey, JSON.stringify(result));
    return result;
  }
}
