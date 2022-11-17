import { CerfasDb } from "../model/collections.js";
import { defaultValuesCerfa } from "../model/cerfa.model/cerfa.model.js";

/**
 * Méthode de création d'un cerfa
 * @returns
 */
export const createCerfa = async () => {
  const { insertedId } = await CerfasDb().insertOne({
    ...defaultValuesCerfa(),
  });

  return insertedId;
};
