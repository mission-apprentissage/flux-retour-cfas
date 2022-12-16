import { dossiersApprenantsMigrationDb } from "../model/collections.js";
import {
  defaultValuesDossiersApprenantsMigration,
  validateDossiersApprenantsMigration,
} from "../model/next.toKeep.models/dossiersApprenantsMigration.model.js";

/**
 * Méthode de création d'un dossierApprenantMigration depuis un dossier apprenant historique
 * @param {*} props
 * @returns
 */
export const createDossierApprenantMigrationFromDossierApprenant = async ({
  organisme_id,
  nom_apprenant,
  prenom_apprenant,
  date_de_naissance_apprenant,
  contrat_date_debut,
  contrat_date_fin,
  contrat_date_rupture,
  code_commune_insee_apprenant,
  siret_etablissement,
  email_contact,
  formation_rncp,
  telephone_apprenant,
  ...data
}) => {
  const entity = {
    ...defaultValuesDossiersApprenantsMigration(),
    organisme_id,
    ...(code_commune_insee_apprenant ? { code_commune_insee_apprenant } : {}),
    ...(siret_etablissement ? { siret_etablissement } : {}),
    ...(email_contact ? { email_contact } : {}),
    ...(formation_rncp ? { formation_rncp } : {}),
    ...(telephone_apprenant ? { telephone_apprenant } : {}),
    ...(nom_apprenant ? { nom_apprenant: nom_apprenant.toUpperCase().trim() } : {}),
    ...(prenom_apprenant ? { prenom_apprenant: prenom_apprenant.toUpperCase().trim() } : {}),
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
  };

  const { insertedId } = await dossiersApprenantsMigrationDb().insertOne(validateDossiersApprenantsMigration(entity));
  return await dossiersApprenantsMigrationDb().findOne({ _id: insertedId });
};
