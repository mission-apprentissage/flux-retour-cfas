const { stringify } = require("json-stringify-deterministic/lib/defaults");

/**
 * It takes a route and a set of filters and returns a string that uniquely identifies the route and
 * filters
 * @param route - The route that we want to cache.
 * @param filters - an object containing the filters that are applied to the route
 * @returns A string that is the route and the filters.
 */

const getCacheKeyForRoute = (route, filters) => {
  // we use json-stringify-deterministic to make sure that {a: 1, b: 2} stringified is the same as {b: 2, a: 1}
  return `${route}:${stringify(filters)}`;
};

module.exports = {
  getCacheKeyForRoute,
};
