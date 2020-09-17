const trimObjValues = (data) => {
  data.forEach(function (o) {
    Object.keys(o).forEach(function (key) {
      o[key] = typeof o[key] === "string" ? o[key].trim() : o[key];
    });
  });
  return data;
};
module.exports.trimObjValues = trimObjValues;

const getDuplicates = (arr) => {
  const seen = new Set();
  const store = new Array();
  arr.filter((item) => seen.size === seen.add(item).size && !store.includes(item) && store.push(item));
  return store;
};
module.exports.getDuplicates = getDuplicates;
