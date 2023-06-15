import { jwtSessionsDb } from "@/common/model/collections";
import { createUserTokenSimple } from "@/common/utils/jwtUtils";

export async function createSession(email: string, additionalProperties?: any): Promise<string> {
  const token = createUserTokenSimple({ payload: { email, ...additionalProperties } });
  await jwtSessionsDb().insertOne({ jwt: token });
  return token;
}

export const findSessionByToken = async (token: string) => {
  return await jwtSessionsDb().findOne({ jwt: token });
};

export const removeSession = async (token: string) => {
  await jwtSessionsDb().deleteOne({ jwt: token });
};
