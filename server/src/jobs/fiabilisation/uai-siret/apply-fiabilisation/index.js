import { createJobEvent } from "../../../../common/actions/jobEvents.actions.js";
import { FIABILISATION_TYPES } from "../../../../common/constants/fiabilisationConstants.js";
import logger from "../../../../common/logger.js";
import {
  dossiersApprenantsMigrationDb,
  fiabilisationUaiSiretDb,
  organismesDb,
} from "../../../../common/model/collections.js";

const JOB_NAME = "apply-fiabilisation-uai-siret";

const filters = {
  annee_scolaire: { $in: ["2022-2022", "2022-2023", "2023-2023"] },
};

/**
 * Méthode d'application de la fiabilisation pour les 3 cas :
 *  Données à fiabiliser (depuis les couples construits) : MAJ des dossiersApprenantsMigration ainsi que le champ fiabilisation_statut des organismes concernés
 *  Données déja identifiées comme fiables : MAJ le champ fiabilisation_statut des organismes concernés
 *  Données identifiées comme non fiabilisables : MAJ le champ fiabilisation_statut des organismes concernés
 * TODO : optim query lookup possibles & promise.all
 *
 */
export const applyFiabilisationUaiSiret = async () => {
  await updateDossiersApprenantAndOrganismesAFiabiliser();
  await updateOrganismesFiabilisationStatut(FIABILISATION_TYPES.DEJA_FIABLE);
  await updateOrganismesFiabilisationStatut(FIABILISATION_TYPES.NON_FIABILISABLE);
};

/**
 * Méthode de maj des dossiersApprenants pour prise en compte de la fiabilisation UAI SIRET
 */
const updateDossiersApprenantAndOrganismesAFiabiliser = async () => {
  const allCouplesAFiabiliser = await fiabilisationUaiSiretDb()
    .find({ type: FIABILISATION_TYPES.A_FIABILISER })
    .toArray();

  let dossiersApprenantAfiabiliserModifiedCount = 0;
  let organismesAFiabiliserModifiedCount = 0;

  for (const fiabilisation of allCouplesAFiabiliser) {
    try {
      // Update de tous les dossiersApprenantsMigration qui étaient sur le mauvais couple UAI-SIRET
      const { modifiedCount: dossiersApprenantModifiedCount } = await dossiersApprenantsMigrationDb().updateMany(
        { ...filters, uai_etablissement: fiabilisation.uai, siret_etablissement: fiabilisation.siret },
        {
          $set: {
            uai_etablissement: fiabilisation.uai_fiable,
            siret_etablissement: fiabilisation.siret_fiable,
          },
        }
      );
      dossiersApprenantAfiabiliserModifiedCount += dossiersApprenantModifiedCount;

      // Update de l'organisme lié à un couple UAI-SIRET marqué comme A_FIABILISER en FIABILISE
      const { modifiedCount: organismesModifiedCount } = await organismesDb().update(
        { uai: fiabilisation.uai_fiable, siret: fiabilisation.siret_fiable },
        { $set: { fiabilisation_statut: FIABILISATION_TYPES.FIABILISE } }
      );
      organismesAFiabiliserModifiedCount += organismesModifiedCount;
    } catch (err) {
      // TODO Fixer l'erreur de duplicate key sur l'id_erp_apprenant
      logger.error(err);
      await createJobEvent({
        jobname: JOB_NAME,
        date: new Date(),
        action: "updateDossiersApprenantAndOrganismesAFiabiliser",
        data: {
          uai: fiabilisation.uai,
          uai_fiable: fiabilisation.uai_fiable,
          siret: fiabilisation.siret,
          siret_fiable: fiabilisation.siret_fiable,
          err,
        },
      });
    }
  }

  await createJobEvent({
    jobname: JOB_NAME,
    date: new Date(),
    action: "updateDossiersApprenantAndOrganismesAFiabiliser",
    data: {
      dossiersApprenantAfiabiliserModifiedCount,
      organismesAFiabiliserModifiedCount,
    },
  });

  logger.info(dossiersApprenantAfiabiliserModifiedCount, "dossiers apprenants a fiabiliser mis à jour");
  logger.info(organismesAFiabiliserModifiedCount, "organismes a fiabiliser  mis à jour");
};

/**
 *
 * @param {*} fiabilisationType
 */
const updateOrganismesFiabilisationStatut = async (fiabilisationType) => {
  const allFiabilisationCouples = await fiabilisationUaiSiretDb().find({ type: fiabilisationType }).toArray();

  let organismesUpdatedCount = 0;

  for (const fiabilisation of allFiabilisationCouples) {
    try {
      const { modifiedCount } = await organismesDb().updateMany(
        { uai: fiabilisation.uai, siret: fiabilisation.siret },
        { $set: { fiabilisation_statut: fiabilisationType } }
      );
      organismesUpdatedCount += modifiedCount;
    } catch (err) {
      logger.error(err);
    }
  }

  await createJobEvent({
    jobname: JOB_NAME,
    date: new Date(),
    action: "updateOrganismesFiabilisationStatut",
    data: {
      organismesUpdatedCount,
    },
  });
  logger.info(`${organismesUpdatedCount} organismes mis à jour pour le type de fiabilisation : ${fiabilisationType}`);
};
