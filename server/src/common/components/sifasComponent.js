import { SifasDb } from "../model/collections.js";
import { defaultValuesSifa } from "../model/new.models/sifa.model/sifa.model.js";

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
