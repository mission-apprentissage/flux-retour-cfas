export function sortAlphabeticallyBy<T>(sortBy: string, array: readonly T[]): T[] {
  return array.slice().sort((a, b) => {
    // if values to compare are string, lowercase and trim it
    const firstElem = typeof a[sortBy] === "string" ? a[sortBy].toLocaleLowerCase().trim() : a[sortBy];
    const secondElem = typeof b[sortBy] === "string" ? b[sortBy].toLocaleLowerCase().trim() : b[sortBy];

    if (firstElem < secondElem) return -1;
    if (firstElem > secondElem) return 1;

    return 0;
  });
}
