import { normalize } from "./stringUtils";

export function sortByNormalizedLabels(array) {
  return array
    .map((element) => {
      element.__label = normalize(element.label);
    })
    .sort(sortByLabel);
}

function sortByLabel(a, b) {
  return a.__label < b.__label ? -1 : 1;
}
