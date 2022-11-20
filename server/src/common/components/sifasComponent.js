import { SifasDb } from "../model/collections.js";
import { defaultValuesSifa } from "../model/next.toKeep.models/sifas.model/sifas.model.js";

/**
 * Méthode de création d'un sifa
 * @returns
 */
export const createSifa = async () => {
  const { insertedId } = await SifasDb().insertOne({
    ...defaultValuesSifa(),
  });

  return insertedId;
};
