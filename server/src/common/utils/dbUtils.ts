/**
 * Find data in mongoCollection and return paginated list
 * @param {*} collection
 * @param {*} query
 * @param {*} options
 * @returns
 */
export const findAndPaginate = async (collection, query, options: any = {}) => {
  let page = options.page || 1;
  let limit = options.limit || 10;
  let skip = (page - 1) * limit;

  let total = await collection.countDocuments(query);

  return {
    find: collection
      .find(query, options.projection ? { projection: options.projection } : {})
      .sort(options.sort || {})
      .skip(skip)
      .limit(limit),
    pagination: {
      page,
      resultats_par_page: limit,
      nombre_de_page: Math.ceil(total / limit) || 1,
      total,
    },
  };
};
