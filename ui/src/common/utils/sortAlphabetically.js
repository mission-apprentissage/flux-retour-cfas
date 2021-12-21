export const sortAlphabeticallyBy = (sortBy, array) => {
  return array.slice().sort((a, b) => {
    if (a[sortBy].toLowerCase().trim() < b[sortBy].toLowerCase().trim()) return -1;
    if (a[sortBy].toLowerCase().trim() > b[sortBy].toLowerCase().trim()) return 1;
    return 0;
  });
};
