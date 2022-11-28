import Joi from "joi";
import { transformToInternationalNumber } from "../../../../common/utils/validationsUtils/frenchTelephoneNumber.js";
import { dossiersApprenantsMigrationDb } from "../../../../common/model/collections.js";
import {
  defaultValuesDossiersApprenantsMigration,
  validateDossiersApprenantsMigration,
} from "../../../../common/model/next.toKeep.models/dossiersApprenantsMigration.model.js";
import { createEffectif, updateEffectifAndLock } from "../../../../common/actions/effectifs.actions.js";

export const createEffectifFromDossierApprenantMigrated = async (dossiersApprenantsMigrated) => {
  // Map dossiersApprenantsMigrated fields for creation / update
  const {
    organisme_id,
    annee_scolaire,
    source,
    id_erp_apprenant,

    formation_cfd: cfd,
    formation_rncp: rncp,
    libelle_long_formation: libelle_long,
    niveau_formation: niveau,
    niveau_formation_libelle: niveau_libelle,
    periode_formation: periode,
    annee_formation: annee,

    nom_apprenant: nom,
    prenom_apprenant: prenom,
    ine_apprenant: ine,
    date_de_naissance_apprenant: date_de_naissance,
    email_contact: courriel,
    telephone_apprenant: telephone,

    historique_statut_apprenant: historique_statut,
  } = dossiersApprenantsMigrated;

  // Create effectif not locked
  const effectifId = await createEffectif({
    organisme_id,
    annee_scolaire,
    source,
    id_erp_apprenant,
    apprenant: {
      nom,
      prenom,
    },
    formation: {
      cfd,
    },
  });

  // Maj de l'effectif en le lockant
  await updateEffectifAndLock(effectifId, {
    apprenant: { ine, nom, prenom, date_de_naissance, courriel, telephone, historique_statut },
    formation: {
      cfd,
      rncp,
      libelle_long,
      niveau,
      niveau_libelle,
      periode,
      annee,
    },
  });
};

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

/**
 * Méthode (temp) de transformation des props d'un dossiersApprenant en props d'un dossiersApprenantMigration
 * Gestion des fields nulls à mettre en string ""
 * Gestion des historiques non clean
 */
export const mapToDossiersApprenantsMigrationProps = (props) => {
  const toReturn = {
    ...props,

    // Transformation des props null en string empty
    ine_apprenant: props.ine_apprenant ?? "",
    etablissement_adresse: props.etablissement_adresse ?? "",
    id_erp_apprenant: props.id_erp_apprenant ?? "",
    tel_apprenant: props.tel_apprenant ?? "",
    niveau_formation: props.niveau_formation ?? "",
    niveau_formation_libelle: props.niveau_formation_libelle ?? "",
    libelle_long_formation: props.libelle_long_formation ?? "",

    // Transformation des props en vérifiant le pattern et mettant undefined si non valide
    code_commune_insee_apprenant: validateOrTransformCodeCommune(props.code_commune_insee_apprenant),
    email_contact: validateOrTransformEmailContact(props.email_contact),
    formation_rncp: validateOrTransformFormationRncp(props.formation_rncp),
    telephone_apprenant: validateOrTransformTelephone(props.tel_apprenant),

    // Transformation si nécessaire des historiques
    historique_statut_apprenant: validateOrTransformHistorique(props),

    periode_formation: props.periode_formation ?? [],
    updated_at: props.updated_at ?? new Date(),
  };

  // Replaced by telephone_apprenant
  delete toReturn.tel_apprenant;
  return toReturn;
};

/**
 * Méthode de validation ou transformation en undefined du code_commune_insee_apprenant
 * @param {*} code_commune_insee_apprenant
 * @returns
 */
const validateOrTransformTelephone = (tel_apprenant) => {
  const regexPattern = /^([+])?(\d{7,12})$/; // TODO Mettre le pattern utilisé dans le modèle dans une constante pour le réutiliser
  let isValid = Boolean(tel_apprenant) && regexPattern.test(tel_apprenant);

  // Test transform into valid telephone if good length but not valid
  if (!isValid && tel_apprenant?.length === 10) {
    const transformedPhoneNumber = transformToInternationalNumber(tel_apprenant);
    if (regexPattern.test(transformedPhoneNumber)) return transformedPhoneNumber;
  }

  return isValid ? tel_apprenant : undefined;
};

/**
 * Méthode de validation ou transformation en undefined du code_commune_insee_apprenant
 * @param {*} code_commune_insee_apprenant
 * @returns
 */
const validateOrTransformCodeCommune = (code_commune_insee_apprenant) => {
  const regexPattern = /^[0-9]{1}[0-9A-Z]{1}[0-9]{3}$/; // TODO Mettre le pattern utilisé dans le modèle dans une constante pour le réutiliser
  const isValid = Boolean(code_commune_insee_apprenant) && regexPattern.test(code_commune_insee_apprenant);
  return isValid ? code_commune_insee_apprenant : undefined;
};

/**
 * Méthode de validation ou transformation en undefined du email_contact
 * @param {*} code_commune_insee_apprenant
 * @returns
 */
const validateOrTransformEmailContact = (email_contact) => {
  const isValid = !Joi.string().email().validate(email_contact).error;
  return isValid ? email_contact : undefined;
};

/**
 * Méthode de validation ou transformation en undefined du code_commune_insee_apprenant
 * @param {*} code_commune_insee_apprenant
 * @returns
 */
const validateOrTransformFormationRncp = (formation_rncp) => {
  const regexPattern = /^(RNCP)?[0-9]{2,5}$/; // TODO Mettre le pattern utilisé dans le modèle dans une constante pour le réutiliser
  const isValid = Boolean(formation_rncp) && regexPattern.test(formation_rncp);
  return isValid ? formation_rncp : undefined;
};

/**
 * Map & clean des historiques ayant une date de reception manquante
 * va récupérer la date created_at en remplacement de la date de réception manquante
 // TODO : se mettre d'accord sur la gestion à avoir : pour le moment on set la date à created_at / envisager de ne pas prendre le dossier ?
 * @returns
 */
const validateOrTransformHistorique = (props) => {
  // Gestion des historiques ayant une date de reception manquante
  const historiqueMissingDateReception = props.historique_statut_apprenant.some(
    (item) => item.date_reception === undefined
  );

  if (historiqueMissingDateReception) {
    // Construction de l'historique cleaned en settant la date de reception = created_at
    const historiqueCleaned = props.historique_statut_apprenant.map((item) => {
      if (item.date_reception === undefined) return { ...item, date_reception: props.created_at };
      return item;
    });
    return historiqueCleaned;
  } else {
    return props.historique_statut_apprenant;
  }
};
