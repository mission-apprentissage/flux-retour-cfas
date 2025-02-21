import { IOrganisme } from "shared/index";
import { IOrganismesMailReferentielStatut } from "shared/models/data/organismesMailReferentiel.model";

import { organismesDb, organismesMailReferentielDb } from "@/common/model/collections";

const confirmationMailFromStatus = (statut: IOrganismesMailReferentielStatut) => {
  switch (statut) {
    case "valid":
      return true;
    case "error":
    case "invalid":
    case "not_supported":
    default:
      return false;
  }
};

export const hydrateOrganismesMails = async () => {
  const organismesCursor = organismesDb().find({}, { projection: { _id: 1, contacts_from_referentiel: 1 } });

  while (await organismesCursor.hasNext()) {
    const organisme = (await organismesCursor.next()) as IOrganisme;
    const newContactFromRef: Array<any> = [];

    for (const contact of organisme.contacts_from_referentiel) {
      const newContact = { ...contact };
      const email = contact.email;
      const emailFromTdb = await organismesMailReferentielDb().findOne({ email: email });

      if (emailFromTdb && emailFromTdb.statut) {
        newContact.confirmation_tdb = confirmationMailFromStatus(emailFromTdb.statut);
      }
      newContactFromRef.push(newContact);
    }

    await organismesDb().findOneAndUpdate(
      {
        _id: organisme._id,
      },
      {
        $set: {
          contacts_from_referentiel: newContactFromRef,
        },
      }
    );
  }
};
