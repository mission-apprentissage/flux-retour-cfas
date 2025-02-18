/**
 * @param  {any[]} array1
 * @param  {any[]} array2
 * @returns  {boolean}
 */
export const arraysContainSameValues = (array1, array2) => {
  if (!Array.isArray(array1) || !Array.isArray(array2) || array1.length !== array2.length) {
    return false;
  }

  array1.forEach((item) => {
    if (!array2.includes(item)) return false;
  });
  return true;
};

export function stripEmptyFields<T extends object>(object: T): T {
  return Object.entries(object).reduce((acc, [key, value]) => {
    if (typeof value !== "undefined" && value !== null && value !== "") {
      acc[key] = value?.constructor?.name === "Object" ? stripEmptyFields(value) : value;
    }
    return acc;
  }, {}) as T;
}

/**
 * Renvoie une copie de l'objet en paramètre dont les propriétés ont été préfixées.
 * @param prefix
 * @param obj
 * @returns
 */
export function addPrefixToProperties<
  Prefix extends string,
  Obj extends Record<string, any>,
  PrefixedObj = AddPrefix<Prefix, Obj>,
>(prefix: Prefix, obj: Obj): PrefixedObj {
  const newObj = {} as PrefixedObj;

  for (const key in obj) {
    // @ts-expect-error
    newObj[`${prefix}${key}`] = obj[key];
  }

  return newObj;
}

export type AddPrefix<Prefix extends string, T> = {
  [K in keyof T as `${Prefix}${string & K}`]: T[K];
};
