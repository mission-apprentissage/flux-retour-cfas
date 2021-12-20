export const sortAlphabeticallyBy = (array, sortBy) => {
  return array.slice().sort((a, b) => {
    if (a[sortBy] < b[sortBy]) return -1;
    if (a[sortBy] > b[sortBy]) return 1;
    return 0;
  });
};
