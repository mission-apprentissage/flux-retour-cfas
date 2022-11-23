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
 * Gestion des fields nulls à mettre en string ""
 * Gestion des historiques non clean
 */
export const mapToDossiersApprenantsMigrationProps = (props) => {
  const historiqueMissingDateReception = props.historique_statut_apprenant.some(
    (item) => item.date_reception === undefined
  );

  // Remplissage des dates de reception manquantes par la date de création
  // TODO : se mettre d'accord sur la gestion à avoir : pour le moment on set la date à created_at / envisager de ne pas prendre le dossier ?
  const fillEmptyDateReceptionForHistorique = () => {
    const historiqueCleaned = props.historique_statut_apprenant.map((item) => {
      if (item.date_reception === undefined) return { ...item, date_reception: props.created_at };
      return item;
    });
    return historiqueCleaned;
  };

  return {
    ...props,
    // handle null fields to pass in ""
    ine_apprenant: props.ine_apprenant ?? "",
    etablissement_adresse: props.etablissement_adresse ?? "",
    email_contact: props.email_contact ?? "",
    formation_rncp: props.formation_rncp ?? "",
    id_erp_apprenant: props.id_erp_apprenant ?? "",
    tel_apprenant: props.tel_apprenant ?? "",
    niveau_formation: props.niveau_formation ?? "",
    niveau_formation_libelle: props.niveau_formation_libelle ?? "",
    periode_formation: props.periode_formation ?? [],
    updated_at: props.updated_at ?? new Date(),
    libelle_long_formation: props.libelle_long_formation ?? "",
    historique_statut_apprenant: historiqueMissingDateReception
      ? fillEmptyDateReceptionForHistorique()
      : props.historique_statut_apprenant,
  };
};
