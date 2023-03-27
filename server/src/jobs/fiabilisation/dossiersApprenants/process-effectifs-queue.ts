import { PromisePool } from "@supercharge/promise-pool";

import logger from "../../../common/logger.js";
import { effectifsQueueDb } from "../../../common/model/collections.js";
import { runEngine } from "../../../common/actions/engine/engine.actions.js";
import { structureEffectifFromDossierApprenant } from "../../../common/actions/effectifs.actions.js";
import { structureOrganismeFromDossierApprenant } from "../../../common/actions/organismes/organismes.actions.js";
import dossierApprenantSchema from "../../../common/validation/dossierApprenantSchema.js";

const sleep = (m) => new Promise((r) => setTimeout(r, m));

export const processEffectifsQueueEndlessly = async () => {
  logger.info("Process effectifs queue");
  // eslint-disable-next-line no-constant-condition
  while (true) {
    await processEffectifsQueue(10_000);
  }
};

export const processEffectifsQueue = async (sleepDuration?: number) => {
  const count = await effectifsQueueDb().count({ processed_at: { $exists: false } });
  logger.info(`${count} items en attente de traitement`);

  const dataIn = await effectifsQueueDb()
    .find({ processed_at: { $exists: false } })
    .sort({ created_at: 1 })
    .limit(100)
    .toArray();
  let nbItemsValid = 0;

  if (sleepDuration && dataIn.length === 0) {
    await sleep(sleepDuration);
  }
  logger.info(`${dataIn.length} items à processer`);

  await PromisePool.withConcurrency(10)
    .for(dataIn)
    .process(async (effectifQueued, index) => {
      try {
        logger.info(`#${index} Process item ${effectifQueued._id} created at ${effectifQueued.created_at}`);

        const { error, value: effectifNormalized } = dossierApprenantSchema.validate(effectifQueued, {
          stripUnknown: true, // will remove keys that are not defined in schema, without throwing an error
          abortEarly: false, // make sure every invalid field will be communicated to the caller
        });

        if (error) {
          const prettyValidationError = error.details.map(({ message, path }) => ({ message, path }));
          await effectifsQueueDb().updateOne(
            { _id: effectifQueued._id },
            { $set: { validation_errors: prettyValidationError, processed_at: new Date() } }
          );
        } else {
          nbItemsValid++;
          // Build item & map input fields
          const dossierApprenant = {
            ...effectifNormalized,
            source: effectifQueued.source,
            formation_cfd: effectifNormalized.id_formation,
            // periode_formation is sent as string "year1-year2" i.e. "2020-2022", we transform it to [2020-2022]
            periode_formation: effectifNormalized.periode_formation
              ? effectifNormalized.periode_formation.split("-").map(Number)
              : [],
            historique_statut_apprenant: [
              {
                valeur_statut: effectifNormalized.statut_apprenant,
                date_statut: new Date(effectifNormalized.date_metier_mise_a_jour_statut),
                date_reception: new Date(),
              },
            ],
          };

          try {
            // Construction d'un historique à partir du statut et de la date_metier_mise_a_jour_statut
            const effectifData = structureEffectifFromDossierApprenant(dossierApprenant);
            const organismeData = await structureOrganismeFromDossierApprenant(dossierApprenant);

            // Call runEngine -> va créer les données nécessaires (effectifs + organismes)
            const { effectifId } = await runEngine(effectifData, organismeData);

            await effectifsQueueDb().updateOne(
              { _id: effectifQueued._id },
              { $set: { effectif_id: effectifId, processed_at: new Date() } }
            );
          } catch (error: any) {
            logger.info(` Error with item ${effectifQueued._id}: ${error.toString()}`);
            await effectifsQueueDb().updateOne(
              { _id: effectifQueued._id },
              { $set: { processed_at: new Date(), error: error.toString() } }
            );
          }
        }
      } catch (err: any) {
        logger.error(`an error occured while processing effectif queue item ${index}: ${err.message}`);
        logger.error(err);
      }
    });

  logger.info(`${dataIn.length} items processés`);
  logger.info(`${nbItemsValid} items valides`);
  logger.info(`${dataIn.length - nbItemsValid} items invalides`);
};
