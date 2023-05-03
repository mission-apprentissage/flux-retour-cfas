import { normalize } from "./stringUtils";

export function sortByNormalizedLabels<T>(array: T): T {
  return (array as any)
    .map((element) => ({ ...element, __label: normalize(element.label) }))
    .sort((a, b) => (a.__label < b.__label ? -1 : 1))
    .map(({ __label, ...element }) => element);
}
