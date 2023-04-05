import { normalize } from "./stringUtils";

export function sortByNormalizedLabels(array) {
  return array
    .map((element) => ({ ...element, __label: normalize(element.label) }))
    .sort((a, b) => (a.__label < b.__label ? -1 : 1));
}
