import { type AnyBulkWriteOperation } from "mongodb";
import type { IOrganisme } from "shared/models";

import { organismesDb } from "@/common/model/collections";

export const up = async () => {
  const cursor = organismesDb().find({ contacts_from_referentiel: { $exists: true } });

  let bulk: AnyBulkWriteOperation<IOrganisme>[] = [];
  for await (const organisme of cursor) {
    if (organisme.contacts_from_referentiel) {
      const contacts: IOrganisme["contacts_from_referentiel"] = organisme.contacts_from_referentiel
        .map(
          (contact: {
            email?: string;
            confirmé?: boolean;
            sources?: string[];
          }): IOrganisme["contacts_from_referentiel"][number] | null => {
            return contact.email
              ? {
                  confirmation_referentiel: contact.confirmé ?? false,
                  email: contact.email,
                  sources: contact.sources ?? [],
                }
              : null;
          }
        )
        .filter((c) => c !== null);

      bulk.push({
        updateOne: {
          filter: {
            _id: organisme._id,
          },
          update: {
            $set: {
              contacts_from_referentiel: contacts,
            },
          },
        },
      });

      if (bulk.length >= 1_000) {
        await organismesDb().bulkWrite(bulk, { bypassDocumentValidation: true });
        bulk = [];
      }
    }
  }

  if (bulk.length > 0) {
    await organismesDb().bulkWrite(bulk, { bypassDocumentValidation: true });
  }

  await organismesDb().updateMany(
    // @ts-expect-error
    { est_dans_le_referentiel: "present_uai_multiples_dans_tdb" },
    { $set: { est_dans_le_referentiel: "present" } }
  );

  await organismesDb().updateMany(
    { contacts_from_referentiel: { $exists: false } },
    { $set: { contacts_from_referentiel: [] } },
    { bypassDocumentValidation: true }
  );

  await organismesDb().updateMany(
    {
      fiabilisation_api_response: { $exists: true },
    },
    {
      $unset: {
        fiabilisation_api_response: "",
      },
    },
    { bypassDocumentValidation: true }
  );
};
