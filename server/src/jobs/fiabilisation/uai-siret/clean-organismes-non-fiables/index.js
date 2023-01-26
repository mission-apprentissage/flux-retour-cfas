import logger from "../../../../common/logger.js";
import cliProgress from "cli-progress";
import { effectifsDb, fiabilisationUaiSiretDb, organismesDb } from "../../../../common/model/collections.js";
import { findOrganismeByQuery } from "../../../../common/actions/organismes/organismes.actions.js";
import { createJobEvent } from "../../../../common/actions/jobEvents.actions.js";

const loadingBar = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic);
const JOB_NAME = "fiabilisation-clean-organismes-non-fiables";

/**
 * Fonction de nettoyage des organismes non fiables du TdB
 * Se base sur la collection fiabilisationUaiSiretDb contenant la liste des couples UAI - SIRET à fiabiliser
 * Déplacement des contributeurs & effectifs liés puis suppression des organismes
 */
export const cleanOrganismesNonFiables = async () => {
  logger.info("Nettoyage des organismes non fiables");

  let nbOrganismesNonFiablesDansLeTdb = 0;
  let nbOrganismesFiablesLieDansLeTdb = 0;
  let nbEffectifsSwitches = 0;
  let nbContributeursAjoutes = 0;

  let nbOrganismesSupprimes = 0;

  const allFiabilisationCouples = await fiabilisationUaiSiretDb().find().toArray();

  logger.info(`Traitement de ${allFiabilisationCouples.length} couples dans la collection fiabilisation ...`);
  loadingBar.start(allFiabilisationCouples.length, 0);

  for (const { uai, siret, uai_fiable, siret_fiable } of allFiabilisationCouples) {
    try {
      // On cherche dans le tdb la présence de l'organisme non fiable pour le couple uai-siret
      const organismeNonFiable = await findOrganismeByQuery({ uai, siret });

      if (organismeNonFiable) {
        nbOrganismesNonFiablesDansLeTdb++;

        // On cherche dans le tdb la présence de l'organisme fiable rattaché via pour le couple uai_fiable-siret_fiable
        const organismeFiable = await findOrganismeByQuery({ uai: uai_fiable, siret: siret_fiable });

        await createJobEvent({
          jobname: JOB_NAME,
          date: new Date(),
          action: "organisme-non-fiable-found",
          data: { organismeNonFiable, organismeFiable },
        });

        // Si un organisme fiable rattaché est trouvé on switch les effectifs et append les contributeurs
        if (organismeFiable) {
          nbOrganismesFiablesLieDansLeTdb++;
          const modifiedEffectifsCount = await switchEffectifsBetweenOrganismes(
            organismeNonFiable._id,
            organismeFiable._id
          );
          nbEffectifsSwitches += modifiedEffectifsCount;

          await createJobEvent({
            jobname: JOB_NAME,
            date: new Date(),
            action: "organisme-fiable-switch-effectifs",
            data: { organismeFiable, nbEffectifsMaj: modifiedEffectifsCount },
          });

          const modifiedContributeursCount = await appendContributeurFromOrganisme(
            organismeFiable._id,
            organismeNonFiable.contributeurs
          );
          nbContributeursAjoutes += modifiedContributeursCount;

          await createJobEvent({
            jobname: JOB_NAME,
            date: new Date(),
            action: "organisme-fiable-append-contributeurs",
            data: { organismeFiable, nbContributeursAjoutes: modifiedContributeursCount },
          });
        }

        // Suppression de l'organisme non fiable
        await organismesDb().deleteOne({ _id: organismeNonFiable._id });
        await createJobEvent({
          jobname: JOB_NAME,
          date: new Date(),
          action: "organisme-non-fiable-supprime",
          data: { organismeNonFiable },
        });
        nbOrganismesSupprimes++;
      }

      loadingBar.increment();
    } catch (error) {
      await createJobEvent({
        jobname: JOB_NAME,
        date: new Date(),
        action: "clean-error",
        data: { error },
      });
    }
  }

  loadingBar.stop();

  // Log & stats
  logger.info(`-> ${nbOrganismesNonFiablesDansLeTdb} organismes non fiables dans le TdB`);
  logger.info(`-> ${nbOrganismesFiablesLieDansLeTdb} organismes fiables liés à un non fiable dans le TdB`);
  logger.info(`-> ${nbEffectifsSwitches} effectifs switches entre organismes non fiables & fiables`);
  logger.info(
    `-> ${nbContributeursAjoutes} contributeurs ajoutes à un organisme fiable depuis un organisme non fiable`
  );
  logger.info(`-> ${nbOrganismesSupprimes} organismes non fiables supprimés du TdB`);

  await createJobEvent({
    jobname: JOB_NAME,
    date: new Date(),
    action: "finishing",
    data: {
      nbOrganismesNonFiablesDansLeTdb,
      nbOrganismesFiablesLieDansLeTdb,
      nbOrganismesSupprimes,
    },
  });
};

/**
 * Méthode de MAJ de l'organismeId pour les effectifs d'un organismeId source
 * Ne fait pas la MAJ pour un effectif déja existant sur la base de la clé d'unicité
 * @param {*} organismeNonFiableId
 * @param {*} organismeFiableId
 * @returns
 */
const switchEffectifsBetweenOrganismes = async (organismeNonFiableId, organismeFiableId) => {
  let switchedCount = 0;

  try {
    const updated = await effectifsDb().updateMany(
      { organisme_id: organismeNonFiableId },
      { $set: { organisme_id: organismeFiableId } }
    );
    switchedCount = updated.modifiedCount;
  } catch (error) {
    await createJobEvent({
      jobname: JOB_NAME,
      date: new Date(),
      action: "switchEffectifsBetweenOrganismes-error",
      data: {
        error,
        organismeNonFiableId,
        organismeFiableId,
      },
    });

    // TODO : Analyse des effectifs non switchés mais qui devraient se rattacher dès le lendemain
  }

  return switchedCount;
};

/**
 * Méthode d'ajout d'une liste de contributeurs à un organisme
 * @param {*} organismeToUpdateId
 * @param {*} contributeursToAppend
 * @returns
 */
const appendContributeurFromOrganisme = async (organismeToUpdateId, contributeursToAppend = []) => {
  const updated = await organismesDb().updateOne(
    { _id: organismeToUpdateId },
    {
      $addToSet: {
        // https://www.mongodb.com/docs/manual/reference/operator/update/addToSet/#value-to-add-is-an-array
        contributeurs: { $each: contributeursToAppend },
      },
    },
    { returnDocument: "after" }
  );

  return updated.modifiedCount;
};
