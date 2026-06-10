import Boom from "boom";
import { ObjectId } from "mongodb";
import { z } from "zod";

import { sipaUsersDb } from "@/common/model/collections";
import { createSipaToken } from "@/common/utils/jwtUtils";
import { compare, hash } from "@/common/utils/passwordUtils";
import config from "@/config";

const SIPA_USERNAME_REGEX = /^[A-Za-z0-9._-]+$/;

export const zSipaLoginBody = z.object({
  username: z.string().min(1).max(64).regex(SIPA_USERNAME_REGEX),
  password: z.string().min(1).max(128),
});

export const isSipaConfigured = !!config.auth.sipa.jwtSecret;

// Hash factice pour éviter les attaques par timing
const DUMMY_HASH = hash("dummy-password-never-matches");

export async function loginSipa(username: string, password: string): Promise<{ token: string; expiresIn: number }> {
  const user = isSipaConfigured ? await sipaUsersDb().findOne({ username }) : null;
  const passOk = compare(password, user?.password ?? DUMMY_HASH);
  if (!user || !passOk) throw Boom.unauthorized("Identifiant ou mot de passe incorrect");
  await sipaUsersDb().updateOne({ _id: user._id }, { $set: { last_connection: new Date() } });

  return { token: createSipaToken(username), expiresIn: config.auth.sipa.expiresIn };
}

export async function createSipaUser(username: string, password: string): Promise<void> {
  if (!SIPA_USERNAME_REGEX.test(username) || username.length > 64) {
    throw Boom.badRequest("Username invalide : alphanumérique + . - _ (max 64 caractères)");
  }
  if (password.length < 20) {
    throw Boom.badRequest("Le mot de passe doit faire au moins 20 caractères");
  }
  const existing = await sipaUsersDb().findOne({ username });
  if (existing) throw Boom.conflict(`Le compte SIPA "${username}" existe déjà`);
  await sipaUsersDb().insertOne({
    _id: new ObjectId(),
    username,
    password: hash(password),
    created_at: new Date(),
  });
}

export async function deleteSipaUser(username: string): Promise<void> {
  const { deletedCount } = await sipaUsersDb().deleteOne({ username });
  if (!deletedCount) throw Boom.notFound(`Compte SIPA "${username}" introuvable`);
}
