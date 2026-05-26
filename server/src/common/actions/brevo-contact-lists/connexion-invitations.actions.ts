import { ObjectId } from "bson";
import type { IConnexionInvitation } from "shared/models/data/connexionInvitations.model";

import { connexionInvitationsDb } from "@/common/model/collections";
import { generateKey } from "@/common/utils/cryptoUtils";

/**
 * Un même email = un même token tant que le document n'est pas supprimé.
 * Pas d'expiration : le token pré-remplit l'email côté UI mais n'authentifie
 * pas (le mot de passe reste requis).
 */
export const getOrCreateConnexionInvitationByEmail = async ({
  email,
  source,
}: {
  email: string;
  source?: string;
}): Promise<string> => {
  const now = new Date();
  const tentativeToken = generateKey(50, "hex");

  const result = await connexionInvitationsDb().findOneAndUpdate(
    { email },
    {
      $setOnInsert: {
        _id: new ObjectId(),
        token: tentativeToken,
        email,
        created_at: now,
      },
      $set: {
        updated_at: now,
        ...(source ? { source } : {}),
      },
    },
    { upsert: true, returnDocument: "after" }
  );

  return result.value?.token ?? tentativeToken;
};

export const getConnexionInvitationByToken = async (token: string): Promise<IConnexionInvitation | null> => {
  return await connexionInvitationsDb().findOne({ token });
};

/**
 * Variante batch (1 find + éventuellement 1 insertMany + 1 updateMany) au lieu
 * de N findOneAndUpdate parallèles qui saturent le pool Mongo en prod.
 * Seuls les nouveaux emails consomment `generateKey()`.
 */
export const getOrCreateConnexionInvitationsByEmails = async (
  items: Array<{ email: string; source?: string }>
): Promise<Map<string, string>> => {
  if (items.length === 0) return new Map();
  const now = new Date();
  const db = connexionInvitationsDb();
  const emails = items.map((i) => i.email);
  const source = items.find((i) => i.source)?.source;

  const existing = await db.find({ email: { $in: emails } }, { projection: { email: 1, token: 1 } }).toArray();
  const existingByEmail = new Map<string, string>();
  for (const e of existing) existingByEmail.set(e.email, e.token);

  const newDocs = items
    .filter((i) => !existingByEmail.has(i.email))
    .map(({ email, source: src }) => ({
      _id: new ObjectId(),
      token: generateKey(50, "hex"),
      email,
      ...(src ? { source: src } : {}),
      created_at: now,
      updated_at: now,
    }));

  // Indices des inserts qui ont raté à cause d'une race condition E11000.
  // Pour ces docs, le token local est INVALIDE — un autre process a gagné la
  // course et persisté son propre token. On les relit en DB plus bas.
  const failedIndices = new Set<number>();
  if (newDocs.length > 0) {
    try {
      await db.insertMany(newDocs as any, { ordered: false });
    } catch (err: any) {
      const writeErrors: Array<{ code?: number; index?: number }> = err.writeErrors ?? [];
      const allDupKey = err.code === 11000 || (writeErrors.length > 0 && writeErrors.every((e) => e.code === 11000));
      if (!allDupKey) throw err;
      for (const we of writeErrors) {
        if (typeof we.index === "number") failedIndices.add(we.index);
      }
    }
  }

  if (existing.length > 0) {
    await db.updateMany(
      { email: { $in: [...existingByEmail.keys()] } },
      { $set: { updated_at: now, ...(source ? { source } : {}) } }
    );
  }

  const byEmail = new Map<string, string>(existingByEmail);
  newDocs.forEach((d, i) => {
    if (failedIndices.has(i)) return;
    if (!byEmail.has(d.email)) byEmail.set(d.email, d.token);
  });

  // Filet de sécurité : récupère depuis la DB les tokens des emails perdus par
  // race condition (les `failedIndices`, intentionnellement non poussés ci-dessus).
  const missing = emails.filter((e) => !byEmail.has(e));
  if (missing.length > 0) {
    const raced = await db.find({ email: { $in: missing } }, { projection: { email: 1, token: 1 } }).toArray();
    for (const r of raced) byEmail.set(r.email, r.token);
  }

  return byEmail;
};
