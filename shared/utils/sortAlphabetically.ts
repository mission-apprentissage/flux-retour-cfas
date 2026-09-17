export function sortAlphabeticallyBy<Key extends string, T extends Record<Key, unknown>>(
  sortBy: Key,
  array: readonly T[]
): T[] {
  return array.slice().sort((a, b) => Intl.Collator().compare(String(a[sortBy]), String(b[sortBy]))); // permet de gérer les accents
}
