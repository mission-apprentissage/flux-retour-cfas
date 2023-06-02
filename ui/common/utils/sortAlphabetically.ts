export function sortAlphabeticallyBy<Key extends string, T extends { [key in Key]: any }>(
  sortBy: Key,
  array: readonly T[]
): T[] {
  return array.slice().sort((a, b) => Intl.Collator().compare(a[sortBy], b[sortBy])); // permet de gérer les accents
}
