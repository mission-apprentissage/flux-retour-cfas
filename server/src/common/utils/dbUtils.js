/**
 * Find data in mongoCollection and return paginated list
 * @param {*} collection
 * @param {*} query
 * @param {*} options
 * @returns
 */
const findAndPaginate = async (collection, query, options = {}) => {
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

/**
 * Checks if a collection exists in a mongo database.
 *
 * @param db a mongo db object.  eg.
 *    client = await MongoClient.connect(uri);
 *    db = client.db();
 * @param collectionName the name of the collection to search for
 * @returns {Promise<boolean>}
 */
const doesCollectionExistInDb = async (db, collectionName) => collectionName in db.collections;

module.exports = { findAndPaginate, doesCollectionExistInDb };
