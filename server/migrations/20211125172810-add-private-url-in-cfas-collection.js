export const up = async (db) => {
  const collection = db.collection("cfas");

  await collection.updateMany({}, { $rename: { url_access_token: "access_token" } });
};

export const down = async (db) => {
  const collection = db.collection("cfas");

  await collection.updateMany({}, { $rename: { access_token: "url_access_token" } });
};
