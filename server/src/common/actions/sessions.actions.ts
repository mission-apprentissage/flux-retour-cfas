import { ObjectId } from "mongodb";

import { jwtSessionsDb } from "@/common/model/collections";
import { createUserTokenSimple } from "@/common/utils/jwtUtils";

export async function createSession(
  email: string,
  additionalProperties?: Record<string, any>,
  amr = "pwd"
): Promise<string> {
  const token = createUserTokenSimple({ payload: { email, amr, ...additionalProperties } });
  await jwtSessionsDb().insertOne({ _id: new ObjectId(), jwt: token });
  return token;
}

export const findSessionByToken = async (token: string) => {
  return await jwtSessionsDb().findOne({ jwt: token });
};

export const removeSession = async (token: string) => {
  await jwtSessionsDb().deleteOne({ jwt: token });
};
