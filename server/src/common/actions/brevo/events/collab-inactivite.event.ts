import { ObjectId } from "bson";
import { addDays, format } from "date-fns";
import { CFA_COLLAB_INACTIVITE_SUSPENSION_DAYS } from "shared/constants/collaboration";

import { organisationsDb, organismesDb, usersMigrationDb } from "@/common/model/collections";
import { getPublicUrl } from "@/common/utils/emailsUtils";

import { BrevoEventDefinition } from "./types";

// `null` si l'événement est devenu obsolète entre l'enqueue et l'envoi (reconnexion, désinscription).
export const collabInactiviteEvent: BrevoEventDefinition = {
  key: "collab-inactivite",
  eventName: "collab_inactivite_cfa",
  buildPayload: async ({ userId }) => {
    const user = await usersMigrationDb().findOne({ _id: new ObjectId(userId) });
    if (!user?.email || user.account_status !== "CONFIRMED" || user.unsubscribe === true) return null;

    const organisation = await organisationsDb().findOne({ _id: user.organisation_id });
    if (organisation?.type !== "ORGANISME_FORMATION" || !organisation.organisme_id) return null;

    const organisme = await organismesDb().findOne(
      { _id: new ObjectId(organisation.organisme_id) },
      { projection: { nom: 1, raison_sociale: 1, enseigne: 1, collab_inactivity_email_sent_at: 1 } }
    );
    if (!organisme?.collab_inactivity_email_sent_at) return null;

    return {
      identifiers: { emailId: user.email },
      eventProperties: {
        nom_cfa: organisme.enseigne ?? organisme.raison_sociale ?? organisme.nom ?? "",
        date_limite: format(
          addDays(organisme.collab_inactivity_email_sent_at, CFA_COLLAB_INACTIVITE_SUSPENSION_DAYS),
          "dd/MM/yyyy"
        ),
        url_connexion: getPublicUrl("/auth/connexion"),
      },
    };
  },
};
