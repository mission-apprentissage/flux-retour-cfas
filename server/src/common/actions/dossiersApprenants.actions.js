import { dossiersApprenantsMigrationDb } from "../model/collections.js";
import {
  defaultValuesDossiersApprenantsMigration,
  validateDossiersApprenantsMigration,
} from "../model/next.toKeep.models/dossiersApprenantsMigration.model.js";

/**
 * Méthode de création d'un organisme
 * Checks uai format & existence
 * @param {*} organismeProps
 * @returns
 */
export const createDossierApprenant = async ({
  nom_apprenant,
  prenom_apprenant,
  date_de_naissance_apprenant,
  contrat_date_debut,
  contrat_date_fin,
  contrat_date_rupture,
  ...data
}) => {
  const { insertedId } = await dossiersApprenantsMigrationDb().insertOne(
    validateDossiersApprenantsMigration({
      ...defaultValuesDossiersApprenantsMigration(),
      ...(nom_apprenant ? { nom_apprenant: nom_apprenant.toUpperCase().trim() } : {}),
      ...(prenom_apprenant ? { nom_apprenant: prenom_apprenant.toUpperCase().trim() } : {}),
      ...(date_de_naissance_apprenant
        ? {
            date_de_naissance_apprenant:
              date_de_naissance_apprenant instanceof Date
                ? date_de_naissance_apprenant
                : new Date(date_de_naissance_apprenant),
          }
        : {}),
      ...(contrat_date_debut
        ? { contrat_date_debut: contrat_date_debut instanceof Date ? contrat_date_debut : new Date(contrat_date_debut) }
        : {}),
      ...(contrat_date_fin
        ? { contrat_date_fin: contrat_date_fin instanceof Date ? contrat_date_fin : new Date(contrat_date_fin) }
        : {}),
      ...(contrat_date_rupture
        ? {
            contrat_date_rupture:
              contrat_date_rupture instanceof Date ? contrat_date_rupture : new Date(contrat_date_rupture),
          }
        : {}),
      ...data,
    })
  );

  return await dossiersApprenantsMigrationDb().findOne({ _id: insertedId });
};
