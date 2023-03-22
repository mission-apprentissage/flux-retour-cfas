import logger from "../../../common/logger.js";
import { effectifsQueueDb } from "../../../common/model/collections.js";
import { runEngine } from "../../../common/actions/engine/engine.actions.js";
import { structureEffectifFromDossierApprenant } from "../../../common/actions/effectifs.actions.js";
import { structureOrganismeFromDossierApprenant } from "../../../common/actions/organismes/organismes.actions.js";
import {
  findDossierApprenantByQuery,
  insertDossierApprenant,
  structureDossierApprenant,
  updateDossierApprenant,
} from "../../../common/actions/dossiersApprenants.actions.js";
import dossierApprenantSchema from "../../../common/validation/dossierApprenantSchema.js";

export const processEffectifsQueue = async () => {
  const dataIn = await effectifsQueueDb()
    .find({ processed_at: { $exists: false } })
    .sort({ created_at: 1 })
    .limit(100)
    .toArray();
  let nbItemsValid = 0;

  // Validate items one by one
  for (let index = 0; index < dataIn.length; index++) {
    const effectifQueued = dataIn[index];

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

      // Construction d'un historique à partir du statut et de la date_metier_mise_a_jour_statut
      const effectifData = structureEffectifFromDossierApprenant(dossierApprenant);
      const organismeData = await structureOrganismeFromDossierApprenant(dossierApprenant);

      // Call runEngine -> va créer les données nécessaires (effectifs + organismes)
      const { organisme } = await runEngine(effectifData, organismeData);

      // POST Engine création du dossierApprenantMigration avec organisme lié
      // TODO à supprimer une fois que la collection DossierApprenantMigration sera useless
      // TODO Store userEvents
      if (organisme.createdId || organisme.foundId) {
        const structuredDossierApprenant = await structureDossierApprenant({
          ...dossierApprenant,
          organisme_id: organisme.createdId || organisme.foundId, // Update sur l'organisme ajouté ou maj,
        });

        // Recherche du dossier via sa clé d'unicité
        const foundDossierWithUnicityFields = await findDossierApprenantByQuery(
          {
            id_erp_apprenant: structuredDossierApprenant.id_erp_apprenant,
            uai_etablissement: structuredDossierApprenant.uai_etablissement,
            annee_scolaire: structuredDossierApprenant.annee_scolaire,
          },
          { _id: 1 }
        );

        const insertedId = foundDossierWithUnicityFields
          ? await updateDossierApprenant(foundDossierWithUnicityFields?._id, structuredDossierApprenant)
          : await insertDossierApprenant(structuredDossierApprenant);

        await effectifsQueueDb().updateOne(
          { _id: effectifQueued._id },
          { $set: { effectif_id: insertedId, processed_at: new Date() } }
        );
      }
    }
  }

  logger.info(`${dataIn.length} items à processer`);
  logger.info(`${nbItemsValid} items valides`);
  logger.info(`${dataIn.length - nbItemsValid} items invalides`);
};
