import { PromisePool } from "@supercharge/promise-pool";

import logger from "../../../common/logger.js";
import { effectifsQueueDb } from "../../../common/model/collections.js";
import {
  buildNewHistoriqueStatutApprenant,
  hydrateEffectif,
  resolveOrganisme,
} from "../../../common/actions/engine/engine.actions.js";
import {
  insertEffectif,
  structureEffectifFromDossierApprenant,
  updateEffectifAndLock,
} from "../../../common/actions/effectifs.actions.js";
import {
  createOrganisme,
  setOrganismeTransmissionDates,
  structureOrganisme,
} from "../../../common/actions/organismes/organismes.actions.js";
import dossierApprenantSchema from "../../../common/validation/dossierApprenantSchema.js";
import { EffectifsQueue } from "@/src/common/model/@types/EffectifsQueue.js";

const sleep = (m) => new Promise((r) => setTimeout(r, m));
const sleepDuration = 10_000;

type Options = { id?: string; force?: boolean };

export const processEffectifsQueueEndlessly = async (options: Options) => {
  logger.info("Process effectifs queue");

  // the inc is here to avoid infinite loop and memory leak
  let inc = 0;
  do {
    const { totalProcessed } = await processEffectifsQueue({ ...options });
    if (sleepDuration && totalProcessed === 0 && !options.id) {
      await sleep(sleepDuration);
    }
    inc++;
  } while (!options.id && inc < 100);
};

export const processEffectifsQueue = async (options?: Options) => {
  const { id, force } = options || { id: undefined, force: false };

  const filter: Record<string, any> = force ? {} : { processed_at: { $exists: false } };
  if (id) {
    filter._id = id;
  }

  const count = await effectifsQueueDb().count(filter);

  const dataIn = await effectifsQueueDb().find(filter).sort({ created_at: 1 }).limit(100).toArray();
  let totalValidItems = 0;

  logger.info(`${dataIn.length}/${count} items à processer (avec filtre ${JSON.stringify(filter)}})`);

  await PromisePool.withConcurrency(10)
    .for(dataIn)
    .process(async (effectifQueued, index) => {
      try {
        let dataToUpdate: Partial<EffectifsQueue>;
        logger.info(
          `#${index} Process item ${effectifQueued._id} created at ${effectifQueued.created_at?.toISOString()}`
        );

        const { error, value: effectifNormalized } = dossierApprenantSchema.validate(effectifQueued, {
          stripUnknown: true, // will remove keys that are not defined in schema, without throwing an error
          abortEarly: false, // make sure every invalid field will be communicated to the caller
        });

        if (error) {
          const prettyValidationError = error.details.map(({ message, path }) => ({ message, path }));

          dataToUpdate = { validation_errors: prettyValidationError };
        } else {
          totalValidItems++;
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

            let { organisme, error } = await resolveOrganisme({
              uai: dossierApprenant.uai_etablissement,
              siret: dossierApprenant.siret_etablissement,
            });

            if (error) {
              dataToUpdate = { error: error.toString() };
            } else {
              let organismeWithId;
              if (organisme._id) {
                organismeWithId = organisme;
              } else {
                // nouvelle organisme, on va récupérer les données avec l'API entreprise
                const organismeData = await structureOrganisme({
                  ...organisme,
                  nom: dossierApprenant.nom_etablissement,
                });
                organismeWithId = await createOrganisme(
                  { ...organismeData, ...organisme },
                  {
                    buildFormationTree: false,
                    buildInfosFromSiret: false,
                    callLbaApi: false,
                  }
                );
              }
              await setOrganismeTransmissionDates(organismeWithId);
              effectifData.organisme_id = organismeWithId._id.toString();
              let effectifId: any = null;

              // Gestion de l'effectif
              const { effectif, found } = await hydrateEffectif(effectifData, {
                queryKeys: ["id_erp_apprenant", "organisme_id", "annee_scolaire"],
                checkIfExist: true,
              });

              // Gestion des maj d'effectif
              if (found) {
                effectifId = found._id;

                // Update de historique
                effectif.apprenant.historique_statut = buildNewHistoriqueStatutApprenant(
                  found.apprenant.historique_statut,
                  effectifData.apprenant?.historique_statut[0]?.valeur_statut,
                  effectifData.apprenant?.historique_statut[0]?.date_statut
                );
                await updateEffectifAndLock(effectifId, effectif);
              } else {
                const effectifCreated = await insertEffectif(effectif);
                effectifId = effectifCreated._id;
                await updateEffectifAndLock(effectifId, {
                  apprenant: effectifCreated.apprenant,
                  formation: effectifCreated.formation,
                });
              }

              dataToUpdate = { effectif_id: effectifId };
            }
          } catch (error: any) {
            logger.info(` Error with item ${effectifQueued._id}: ${error.toString()}`);
            dataToUpdate = { error: error.toString() };
          }
        }
        if (dataToUpdate) {
          await effectifsQueueDb().updateOne(
            { _id: effectifQueued._id },
            {
              $set: {
                ...dataToUpdate,
                processed_at: new Date(),
              },
            }
          );
        }
      } catch (err: any) {
        logger.error(`an error occured while processing effectif queue item ${index}: ${err.message}`);
        logger.error(err);
      }
    });

  logger.info(`${dataIn.length} items processés`);
  if (dataIn.length > 0) {
    logger.info(`${totalValidItems} items valides`);
    logger.info(`${dataIn.length - totalValidItems} items invalides`);
  }

  return { totalProcessed: dataIn.length, totalValidItems, totalInvalidItems: dataIn.length - totalValidItems };
};
