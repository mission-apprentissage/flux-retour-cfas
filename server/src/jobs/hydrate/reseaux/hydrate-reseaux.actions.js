import { asyncForEach } from "../../../common/utils/asyncUtils.js";
import { dossiersApprenantsMigrationDb } from "../../../common/model/collections.js";
import { updateDossierApprenant } from "../../../common/actions/dossiersApprenants.actions.js";
import { createJobEvent } from "../../../common/actions/jobEvents.actions.js";

/**
 * MAJ les réseaux des dossiersApprenants de l'organisme si nécessaire
 * @param {*} organismeInReferentiel
 * @param {*} reseau
 */
export const updateDossiersApprenantsNetworksIfNeeded = async (organisme, reseau, JOBNAME) => {
  // Récupération de tous les dossiersApprenants de cet organisme qui n'ont pas ce réseau dans leur liste
  const dossiersApprenantsForOrganismeWithoutThisNetwork = await dossiersApprenantsMigrationDb()
    .find({ uai_etablissement: organisme.uai, etablissement_reseaux: { $ne: reseau } })
    .toArray();

  await asyncForEach(dossiersApprenantsForOrganismeWithoutThisNetwork, async (dossierToUpdate) => {
    try {
      await updateDossierApprenant(dossierToUpdate._id, {
        ...dossierToUpdate,
        etablissement_reseaux: [...dossierToUpdate.etablissement_reseaux, reseau],
      });
    } catch (err) {
      // Log error
      await createJobEvent({
        jobname: JOBNAME,
        date: new Date(),
        action: "update-dossierApprenant-error",
        data: { dossierToUpdate },
      });
    }

    // Log update
    await createJobEvent({
      jobname: JOBNAME,
      date: new Date(),
      action: "update-dossierApprenant-success",
      data: { dossierUpdated: dossierToUpdate },
    });
  });

  return dossiersApprenantsForOrganismeWithoutThisNetwork.length;
};
