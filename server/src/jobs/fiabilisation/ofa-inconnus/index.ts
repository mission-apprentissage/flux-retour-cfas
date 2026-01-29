import { captureException } from "@sentry/node";
import { ObjectId } from "mongodb";

import { findDataFromSiret } from "@/common/actions/infoSiret.actions";
import { InfoSiret } from "@/common/actions/infoSiret.actions-struct";
import logger from "@/common/logger";
import { organismesDb } from "@/common/model/collections";

/**
 * Méthode de remplissage de la raison sociale et de l'enseigne pour les OFA Inconnus
 * via l'API Entreprise
 */
export const hydrateRaisonSocialeEtEnseigneOFAInconnus = async () => {
  const ofaInconnus = await organismesDb()
    .find({ $or: [{ raison_sociale: { $exists: false } }, { enseigne: { $exists: false } }] })
    .toArray();

  logger.info(`${ofaInconnus.length} OFA inconnus à corriger via l'API Entreprise`);

  let nbOfaUpdated = 0;

  for (const { _id, siret } of ofaInconnus) {
    if (await updateEnseigneRaisonSocialeOFAInconnu(_id, siret)) nbOfaUpdated++;
  }

  logger.info(`${nbOfaUpdated} OFA mis à jour via l'API Entreprise`);

  return {
    nbOfaUpdated,
  };
};

/**
 * Fonction de MAJ de la raison sociale / enseigne d'un OF depuis son siret
 * Si on récupère depuis l'API Entreprise l'enseigne OU la raison sociale alors on MAJ l'organisme avec
 * Si l'enseigne est null, on lui affecte la raison sociale
 * Si la raison sociale est nulle, on lui affecte l'enseigne
 */
const updateEnseigneRaisonSocialeOFAInconnu = async (idOfa: ObjectId, siretOfa: string) => {
  const dataSiret: InfoSiret = await findDataFromSiret(siretOfa);

  if (dataSiret.messages.api_entreprise_status === "OK") {
    try {
      if (dataSiret.result.enseigne || dataSiret.result.raison_sociale) {
        await organismesDb().findOneAndUpdate(
          { _id: idOfa },
          {
            $set: {
              enseigne: dataSiret.result.enseigne ?? dataSiret.result.raison_sociale,
              raison_sociale: dataSiret.result.raison_sociale ?? dataSiret.result.enseigne,
            },
          }
        );
        return true;
      }

      return false;
    } catch (err) {
      logger.error(`updateEnseigneRaisonSocialeOFAInconnu > Erreur > ${err}`);
      captureException(err);
    }
  } else {
    logger.error(`updateEnseigneRaisonSocialeOFAInconnu > Erreur API > ${dataSiret.messages.api_entreprise_info}`);
  }
};
