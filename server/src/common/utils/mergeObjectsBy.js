const mergeObjectsBy = (objects = [], key) => {
  return Object.values(
    objects.reduce((acc, cur) => {
      const mergeKey = cur[key];
      const grouped = acc[mergeKey];
      if (grouped) {
        return { ...acc, [mergeKey]: { ...grouped, ...cur } };
      }
      return { ...acc, [mergeKey]: cur };
    }, {})
  );
};

module.exports = { mergeObjectsBy };
