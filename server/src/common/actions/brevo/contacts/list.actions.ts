import { ObjectId } from "bson";

import { brevoContactListDb } from "@/common/model/collections";
import { createBrevoList } from "@/common/services/brevo/brevo";

/**
 * Trouve ou crée le mapping `(slug ↔ listId Brevo)` :
 *  - `listId` fourni → bypass `createBrevoList`, on écrit dans une liste
 *    Brevo gérée hors-code (cas prod réutilisant `202604_tba_bdd_globale`).
 *  - Sinon → crée la liste côté Brevo à la 1ʳᵉ sync, puis idempotent ensuite.
 */
export const getOrCreateContactList = async (params: {
  slug: string;
  name: string;
  folderId: number;
  listId?: number;
}): Promise<number> => {
  const now = new Date();
  const existing = await brevoContactListDb().findOne({ slug: params.slug });

  if (params.listId !== undefined) {
    if (existing) {
      await brevoContactListDb().updateOne(
        { _id: existing._id },
        {
          $set: {
            listId: params.listId,
            listName: params.name,
            folderId: params.folderId,
            updated_at: now,
          },
        }
      );
    } else {
      await brevoContactListDb().insertOne({
        _id: new ObjectId(),
        slug: params.slug,
        listId: params.listId,
        listName: params.name,
        folderId: params.folderId,
        created_at: now,
        updated_at: now,
      });
    }
    return params.listId;
  }

  if (existing) {
    await brevoContactListDb().updateOne(
      { _id: existing._id },
      { $set: { listName: params.name, folderId: params.folderId, updated_at: now } }
    );
    return existing.listId;
  }

  const res = await createBrevoList({ name: params.name, folderId: params.folderId });
  if (res?.response.statusCode !== 201) {
    throw new Error(`Error creating Brevo list for contact list ${params.slug}`);
  }

  await brevoContactListDb().insertOne({
    _id: new ObjectId(),
    slug: params.slug,
    listId: res.body.id,
    listName: params.name,
    folderId: params.folderId,
    created_at: now,
    updated_at: now,
  });

  return res.body.id;
};
