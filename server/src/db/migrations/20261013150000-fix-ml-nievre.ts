import { ObjectId } from "bson";
import type { IOrganisationMissionLocale } from "shared/models";

import { activateMissionLocale } from "@/common/actions/admin/mission-locale/mission-locale.admin.actions";
import {
  enqueueBrevoContactSync,
  enqueueBrevoOrganisationContactSync,
} from "@/common/actions/brevo/contacts/enqueue-sync";
import { enqueueBrevoEvent } from "@/common/actions/brevo/events/enqueue-event";
import { createOrUpdateMissionLocaleStats } from "@/common/actions/mission-locale/mission-locale-stats.actions";
import logger from "@/common/logger";
import { invitationsDb, missionLocaleEffectifsDb, organisationsDb, usersMigrationDb } from "@/common/model/collections";

const ML_ID_NIVERNAIS_MORVAN = 376;
const ML_ID_NEVERS = 58194;
const COMPTE_NEVERS_ID = new ObjectId("6a1e96761a3c2363663d6e09");

export const up = async () => {
  const renommageMorvan = await organisationsDb().updateOne(
    { type: "MISSION_LOCALE", ml_id: ML_ID_NIVERNAIS_MORVAN, siret: { $regex: /^325963619/ } },
    {
      $set: {
        nom: "NIVERNAIS MORVAN",
        siret: "38804605400036",
        email: "milonivernaismorvan@milobfc.fr",
        telephone: "03 86 85 10 77",
        site_web: "https://missionslocales-bfc.fr/mission-locale-nivernais-morvan/",
        adresse: {
          commune: "Château-Chinon (Ville)",
          code_insee: "58062",
          code_postal: "58120",
          departement: "58",
          academie: "07",
          region: "27",
        },
      },
    }
  );

  const renommageNevers = await organisationsDb().updateOne(
    { type: "MISSION_LOCALE", ml_id: ML_ID_NEVERS, nom: "58-ML NEVERS" },
    {
      $set: {
        nom: "NEVERS SUD NIVERNAIS",
        siret: "32596361900045",
        email: "accueil.nevers@milobfc.fr",
        telephone: "03 58 07 81 70",
        site_web: "https://www.missionlocale-nevers.fr/",
        adresse: {
          commune: "Nevers",
          code_insee: "58194",
          code_postal: "58000",
          departement: "58",
          academie: "07",
          region: "27",
        },
      },
    }
  );

  const morvan = (await organisationsDb().findOne({
    type: "MISSION_LOCALE",
    ml_id: ML_ID_NIVERNAIS_MORVAN,
  })) as IOrganisationMissionLocale | null;
  const nevers = (await organisationsDb().findOne({
    type: "MISSION_LOCALE",
    ml_id: ML_ID_NEVERS,
  })) as IOrganisationMissionLocale | null;

  if (!morvan || !nevers) {
    logger.warn({ morvan: !!morvan, nevers: !!nevers }, "[Migration] Fiches ML de la Nièvre introuvables");
    return;
  }

  const deplacement = await usersMigrationDb().updateOne(
    { _id: COMPTE_NEVERS_ID, organisation_id: morvan._id },
    { $set: { organisation_id: nevers._id } }
  );

  if (deplacement.modifiedCount > 0 && morvan.rdv_url && !nevers.rdv_url) {
    await organisationsDb().updateOne({ _id: nevers._id }, { $set: { rdv_url: morvan.rdv_url } });
    await organisationsDb().updateOne({ _id: morvan._id }, { $unset: { rdv_url: "" } });
  }

  const compteSurNevers = await usersMigrationDb().findOne({
    _id: COMPTE_NEVERS_ID,
    organisation_id: nevers._id,
    account_status: "CONFIRMED",
  });

  let neversActivee = false;
  if (compteSurNevers && !nevers.activated_at) {
    await activateMissionLocale(nevers._id, new Date());
    await enqueueBrevoEvent("account-confirmed-ml-generic", { userId: COMPTE_NEVERS_ID.toString() });
    neversActivee = true;
  }

  const [comptesRestantsMorvan, invitationsMorvan] = await Promise.all([
    usersMigrationDb().countDocuments({ organisation_id: morvan._id }),
    invitationsDb().countDocuments({ organisation_id: morvan._id }),
  ]);

  if (comptesRestantsMorvan > 0 || invitationsMorvan > 0) {
    logger.warn(
      { comptesRestantsMorvan, invitationsMorvan },
      "[Migration] Comptes ou invitations encore rattachés à la fiche Nivernais Morvan : elle reste activée"
    );
  }

  let morvanDesactivee = false;
  if (morvan.activated_at && comptesRestantsMorvan === 0 && invitationsMorvan === 0) {
    await organisationsDb().updateOne({ _id: morvan._id }, { $unset: { activated_at: "" } });
    await missionLocaleEffectifsDb().updateMany(
      { mission_locale_id: morvan._id },
      { $unset: { "computed.mission_locale.activated_at": "" } }
    );
    await createOrUpdateMissionLocaleStats(morvan._id);
    morvanDesactivee = true;
  }

  if (deplacement.modifiedCount > 0) {
    await enqueueBrevoContactSync(COMPTE_NEVERS_ID);
  }
  await enqueueBrevoOrganisationContactSync(morvan._id);
  await enqueueBrevoOrganisationContactSync(nevers._id);

  logger.info(
    {
      morvanRenommee: renommageMorvan.modifiedCount,
      neversRenommee: renommageNevers.modifiedCount,
      compteDeplace: deplacement.modifiedCount,
      neversActivee,
      morvanDesactivee,
    },
    "[Migration] Fiches ML de Nevers et du Nivernais Morvan rétablies"
  );
};
