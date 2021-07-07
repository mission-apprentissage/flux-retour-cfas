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

const toDateFromUnixTimestamp = (unixTimestamp) =>
  unixTimestamp ? new Date(unixTimestamp * 1000).toLocaleDateString("fr-FR") : null;
module.exports.toDateFromUnixTimestamp = toDateFromUnixTimestamp;

/**
 * Return unique combinations of fields in array of objects
 * @param {*} arr
 * @param {*} keyProps
 * @returns
 */
const uniqueValues = (arr, keyProps) =>
  Object.values(
    arr.reduce((uniqueMap, entry) => {
      const key = keyProps.map((k) => entry[k]).join("|");
      if (!(key in uniqueMap)) uniqueMap[key] = entry;
      return uniqueMap;
    }, {})
  );
module.exports.uniqueValues = uniqueValues;

const paginate = (items, page = 1, per_page = 10) => {
  const offset = (page - 1) * per_page;
  const paginatedItems = items.slice(offset).slice(0, per_page);
  const total_pages = Math.ceil(items.length / per_page);

  return {
    page: page,
    per_page: per_page,
    pre_page: page - 1 ? page - 1 : null,
    next_page: total_pages > page ? page + 1 : null,
    total: items.length,
    total_pages: total_pages,
    data: paginatedItems,
  };
};
module.exports.paginate = paginate;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
module.exports.sleep = sleep;
