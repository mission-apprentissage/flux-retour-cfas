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
    uai_etablissement: any({ description: organismeProps.uai.description }),
    nom_etablissement: any({ description: organismeProps.nom.description }),
    id_formation: any({ description: formationProps.cfd.description }), // CFD
    annee_scolaire: any({ description: effectifsProps.annee_scolaire.description }),
    statut_apprenant: any({ description: CODES_STATUT_APPRENANT_ENUM.join(",") }),
    date_metier_mise_a_jour_statut: any(),
    id_erp_apprenant: any({ description: effectifsProps.id_erp_apprenant.description }),
    // Optional fields in effectif
    ine_apprenant: any({ description: apprenantProps.ine.description }),
    email_contact: any({ description: apprenantProps.courriel.description }),
    tel_apprenant: any({ description: apprenantProps.telephone.description }),
    code_commune_insee_apprenant: any({ description: apprenantProps.adresse.properties.code_insee.description }),
    siret_etablissement: any({ description: organismeProps.siret.description }),
    libelle_long_formation: any({ description: formationProps.libelle_long.description }),
    periode_formation: any({ description: formationProps.periode.description }),
    annee_formation: any({ description: formationProps.annee.description }),
    formation_rncp: any({ description: formationProps.rncp.description }),

    contrat_date_debut: any({ description: contratProps.date_debut.description }),
    contrat_date_fin: any({ description: contratProps.date_fin.description }),
    contrat_date_rupture: any({ description: contratProps.date_rupture.description }),

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
