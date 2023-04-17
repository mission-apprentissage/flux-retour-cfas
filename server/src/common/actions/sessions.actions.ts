import { jwtSessionsDb } from "../model/collections.js";
import { createUserTokenSimple } from "../utils/jwtUtils.js";

export async function createSession(email: string): Promise<string> {
  const token = createUserTokenSimple({ payload: { email } });
  await jwtSessionsDb().insertOne({ jwt: token });
  return token;
}

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
