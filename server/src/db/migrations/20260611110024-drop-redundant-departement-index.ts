import { getDbCollection } from "@/common/mongodb";

export const up = async () => {
  for (const collectionName of ["effectifs", "effectifsDECA"] as const) {
    const collection = getDbCollection(collectionName);
    const indexes = await collection.indexes();
    if (indexes.some((index) => index.name === "_computed.organisme.departement_1")) {
      await collection.dropIndex("_computed.organisme.departement_1");
    }
  }
};
