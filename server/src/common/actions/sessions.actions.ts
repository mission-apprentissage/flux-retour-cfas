import { jwtSessionsDb } from "../model/collections";

/**
 * Méthode d'ajout de session
 * @param {*} jwt
 */
export const addJwt = async (jwt) => {
  await jwtSessionsDb().insertOne({ jwt });
};

/**
 * Méthode de vérification d'existance
 * @param {*} jwt
 * @returns
 */
export const findJwt = async (jwt) => {
  const session = await jwtSessionsDb().findOne({ jwt });
  return !!session;
};

/**
 * Méthode de suppression de seesion
 * @param {*} jwt
 */
export const removeJwt = async (jwt) => {
  await jwtSessionsDb().deleteOne({ jwt });
};
