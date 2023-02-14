import tryCatch from "./tryCatchMiddleware.js";

// catch errors and return the result of the request handler
export function returnResult(serviceFunc) {
  return tryCatch(async (req, res, next) => {
    const result = await serviceFunc(req, res, next);
    res.set("Content-Type", "application/json");
    res.send(result);
  });
}
