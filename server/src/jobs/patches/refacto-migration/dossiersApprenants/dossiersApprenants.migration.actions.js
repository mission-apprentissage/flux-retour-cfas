import { dossiersApprenantsMigrationDb } from "../../../../common/model/collections.js";
import {
  defaultValuesDossiersApprenantsMigration,
  validateDossiersApprenantsMigration,
} from "../../../../common/model/next.toKeep.models/dossiersApprenantsMigration.model.js";

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
  ...data
}) => {
  const { insertedId } = await dossiersApprenantsMigrationDb().insertOne(
    validateDossiersApprenantsMigration({
      ...defaultValuesDossiersApprenantsMigration(),
      organisme_id,
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
    })
  );

  return await dossiersApprenantsMigrationDb().findOne({ _id: insertedId });
};

/**
 * Méthode (temp) de transformation des props d'un dossiersApprenant en props d'un dossiersApprenantMigration
 * Gestion des ine_apprenant nulls
 */
export const mapToDossiersApprenantsMigrationProps = (props) => {
  return {
    ...props,
    // handle ine null
    ine_apprenant: props.ine_apprenant ?? "",
    // handle etablissement adresse null
    etablissement_adresse: props.etablissement_adresse ?? "",
  };
};
