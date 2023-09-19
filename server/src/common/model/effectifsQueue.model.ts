import { CreateIndexesOptions, IndexSpecification } from "mongodb";

import { CODES_STATUT_APPRENANT_ENUM } from "@/common/constants/dossierApprenant";

import effectifsModel from "./effectifs.model/effectifs.model";
import { apprenantSchema } from "./effectifs.model/parts/apprenant.part";
import { contratSchema } from "./effectifs.model/parts/contrat.part";
import { formationEffectifSchema } from "./effectifs.model/parts/formation.effectif.part";
import { object, string, date, arrayOf, any, objectId } from "./json-schema/jsonSchemaTypes";
import organismesModel from "./organismes.model";

const collectionName = "effectifsQueue";

const indexes: [IndexSpecification, CreateIndexesOptions][] = [
  [{ effectif_id: 1 }, { name: "effectif_id" }],
  [{ organisme_id: 1 }, { name: "organisme_id" }],
  [{ processed_at: 1 }, { name: "processed_at" }],
  [{ created_at: 1 }, { name: "created_at" }],
  [{ id_erp_apprenant: 1 }, { name: "id_erp_apprenant" }],
  [{ source: 1 }, { name: "source" }],
  [{ annee_scolaire: 1 }, { name: "annee_scolaire" }],
  [{ uai_etablissement: 1 }, { name: "uai_etablissement" }],
  [{ siret_etablissement: 1 }, { name: "siret_etablissement" }],
];

const effectifsProps = effectifsModel.schema.properties;
const formationProps = formationEffectifSchema.properties;
const organismeProps = organismesModel.schema.properties;
const contratProps = contratSchema.properties;
const apprenantProps = apprenantSchema.properties;

// internal fields (shared with api V3)
export const internalFields = {
  source: string({ description: effectifsProps.source.description }),
  effectif_id: objectId({ description: "Id de l'effectif associé" }),
  organisme_id: objectId({ description: "Id de l'organisme associé" }),
  updated_at: date({ description: "Date de mise à jour en base de données" }),
  created_at: date({ description: "Date d'ajout en base de données" }),
  processed_at: date({ description: "Date de process des données" }),
  error: any({ description: "Erreur rencontrée lors de la création de l'effectif" }),
  api_version: string({ description: "Version de l'api utilisée (v2 ou v3)" }),
  validation_errors: arrayOf(
    object(
      {
        message: any({ description: "message d'erreur" }),
        path: any({ description: "champ en erreur" }),
      },
      {
        additionalProperties: true,
      }
    ),
    {
      description: "Erreurs de validation de cet effectif",
    }
  ),
};

/**
 * Ce schéma est utilisé pour stocker et valider les données reçues.
 * Il ne contient aucune contrainte afin de pouvoir stocker toutes les données reçues.
 * Une premiere validation est effectuée lors de la réception des données, et les erreurs sont stockées dans le champ `validation_errors`.
 * Une 2eme validation plus poussée (SIRET, formation, ...) est effectuée au moment de la creation de l'effectif et l'erreur est stockée dans le champ `error`.
 */
export const schema = object(
  {
    _id: objectId(),
    // required fields to create an effectif
    nom_apprenant: any({ description: apprenantProps.nom.description }),
    prenom_apprenant: any({ description: apprenantProps.prenom.description }),
    date_de_naissance_apprenant: any({ description: apprenantProps.date_de_naissance.description }),
    uai_etablissement: any({ description: organismeProps.uai.description }), // This field is missing in V3
    nom_etablissement: any({ description: organismeProps.nom.description }), // This field is missing in V3
    id_formation: any({ description: formationProps.cfd.description }), // This field is missing in V3
    annee_scolaire: any({ description: effectifsProps.annee_scolaire.description }),
    statut_apprenant: any({ description: CODES_STATUT_APPRENANT_ENUM.join(",") }),
    date_metier_mise_a_jour_statut: any(),
    id_erp_apprenant: any({ description: effectifsProps.id_erp_apprenant.description }),
    // Optional fields in effectif
    ine_apprenant: any({ description: apprenantProps.ine.description }),
    email_contact: any({ description: apprenantProps.courriel.description }),
    tel_apprenant: any({ description: apprenantProps.telephone.description }),
    code_commune_insee_apprenant: any({ description: apprenantProps.adresse.properties.code_insee.description }), // This field is missing in V3
    siret_etablissement: any({ description: organismeProps.siret.description }), // This field is missing in V3
    libelle_long_formation: any({ description: formationProps.libelle_long.description }), // This field is missing in V3
    periode_formation: any({ description: formationProps.periode.description }), // This field is missing in V3
    annee_formation: any({ description: formationProps.annee.description }),
    formation_rncp: any({ description: formationProps.rncp.description }),

    contrat_date_debut: any({ description: contratProps.date_debut.description }),
    contrat_date_fin: any({ description: contratProps.date_fin.description }),
    contrat_date_rupture: any({ description: contratProps.date_rupture.description }),

    // V3 FIELDS
    // OPTIONAL FIELDS
    nir_apprenant: any({ description: "Identification nationale securité social" }),
    adresse_apprenant: any({ description: "Adresse de l'apprenant" }),
    code_postal_apprenant: any({ description: "Code postal de l'apprenant" }),
    code_postal_de_naissance_apprenant: any({ description: apprenantProps.code_postal_de_naissance.description }),
    sexe_apprenant: any({ description: apprenantProps.sexe.description }),
    rqth_apprenant: any({ description: "Reconnaissance de la Qualité de Travailleur Handicapé de l'apprenant" }),
    date_rqth_apprenant: any({ description: "Date de reconnaissance du RQTH de l'apprenant" }),
    responsable_apprenant_mail1: any({ description: "Mail du responsable de l'apprenant" }),
    responsable_apprenant_mail2: any({ description: "Mail du responsable de l'apprenant" }),
    obtention_diplome_formation: any(),
    date_obtention_diplome_formation: any({ description: formationProps.date_obtention_diplome.description }),
    date_exclusion_formation: any(),
    cause_exclusion_formation: any(),
    nom_referent_handicap_formation: any(),
    prenom_referent_handicap_formation: any(),
    email_referent_handicap_formation: any(),
    cause_rupture_contrat: any({ description: contratProps.cause_rupture.description }),
    contrat_date_debut_2: any({ description: "Date de début du contrat 2" }),
    contrat_date_fin_2: any({ description: "Date de fin du contrat 2" }),
    contrat_date_rupture_2: any({ description: "Date de rupture du contrat 2" }),
    cause_rupture_contrat_2: any({ description: "Cause de rupture du contrat 2" }),
    contrat_date_debut_3: any({ description: "Date de début du contrat 3" }),
    contrat_date_fin_3: any({ description: "Date de fin du contrat 3" }),
    contrat_date_rupture_3: any({ description: "Date de rupture du contrat 3" }),
    cause_rupture_contrat_3: any({ description: "Cause de rupture du contrat 3" }),
    contrat_date_debut_4: any({ description: "Date de début du contrat 4" }),
    contrat_date_fin_4: any({ description: "Date de fin du contrat 4" }),
    contrat_date_rupture_4: any({ description: "Date de rupture du contrat 4" }),
    cause_rupture_contrat_4: any({ description: "Cause de rupture du contrat 4" }),
    siret_employeur: any({ description: organismeProps.siret.description }),
    siret_employeur_2: any({ description: organismeProps.siret.description }),
    siret_employeur_3: any({ description: organismeProps.siret.description }),
    siret_employeur_4: any({ description: organismeProps.siret.description }),
    formation_presentielle: any({ description: "Formation 100% à distance ou non" }),

    // REQUIRED FIELDS
    date_inscription_formation: any({ description: formationProps.date_debut_formation.description }),
    date_entree_formation: any({ description: formationProps.date_debut_formation.description }),
    date_fin_formation: any({ description: formationProps.date_fin_formation.description }),
    duree_theorique_formation: any({ description: "Durée théorique de la formation" }),

    etablissement_responsable_uai: any({ description: "UAI de l'établissement responsable" }),
    etablissement_responsable_siret: any({ description: "SIRET de l'établissement responsable" }),
    etablissement_formateur_uai: any({ description: "UAI de l'établissement formateur" }),
    etablissement_formateur_siret: any({ description: "SIRET de l'établissement formateur" }),
    etablissement_lieu_de_formation_uai: any({ description: "UAI de l'établissement (lieu de formation)" }),
    etablissement_lieu_de_formation_siret: any({ description: "SIRET de l'établissement (lieu de formation)" }),

    formation_cfd: any({ description: formationProps.cfd.description }),

    // internal fields
    ...internalFields,
  },
  {
    required: ["source", "created_at"],
    additionalProperties: true,
  }
);

// Default value
export function defaultValuesEffectifQueue() {
  return {
    validation_errors: [],
    updated_at: new Date(),
    created_at: new Date(),
  };
}

export default { schema, indexes, collectionName };
