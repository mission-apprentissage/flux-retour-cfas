import { normalize } from "./stringUtils";

export function sortByNormalizedLabels<T>(array: T): T {
  return (array as any)
    .map((element) => ({ ...element, __label: normalize(element.label) }))
    .sort((a, b) => (a.__label < b.__label ? -1 : 1))
    .map(({ __label, ...element }) => element);
}

export function pick<Obj extends object, Key extends keyof Obj>(object: Obj, keys: Key[]): Pick<Obj, Key> {
  return keys.reduce((copy, key) => {
    copy[key] = object[key];
    return copy;
  }, {} as any);
}
