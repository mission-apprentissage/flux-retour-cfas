import { CreateIndexesOptions, IndexSpecification } from "mongodb";

import { CODES_STATUT_APPRENANT_ENUM } from "@/common/constants/dossierApprenant";

import { object, string, date, arrayOf, any, objectId } from "./json-schema/jsonSchemaTypes";

const collectionName = "effectifsQueue";

const indexes: [IndexSpecification, CreateIndexesOptions][] = [
  [{ effectif_id: 1 }, { name: "effectif_id" }],
  [{ processed_at: 1 }, { name: "processed_at" }],
  [{ created_at: 1 }, { name: "created_at" }],
  [{ id_erp_apprenant: 1 }, { name: "id_erp_apprenant" }],
  [{ source: 1 }, { name: "source" }],
  [{ annee_scolaire: 1 }, { name: "annee_scolaire" }],
];

/**
 * this schema doesn't contain any constraint
 */
export const schema = object(
  {
    // required fields to create an effectif
    nom_apprenant: any(),
    prenom_apprenant: any(),
    date_de_naissance_apprenant: any({ description: "Date de naissance de l'apprenant" }),
    uai_etablissement: any({ description: "UAI de l'établissement" }),
    nom_etablissement: any({ description: "Nom de l'établissement" }),
    id_formation: any({ description: "Code CFD de la formation" }),
    annee_scolaire: any({
      description: `Année scolaire sur laquelle l'apprenant est enregistré (ex: "2020-2021")`,
    }),
    statut_apprenant: any({ description: CODES_STATUT_APPRENANT_ENUM.join(",") }),
    date_metier_mise_a_jour_statut: any(),
    id_erp_apprenant: any({ description: "Identifiant de l'apprenant dans l'erp" }),

    // Optional fields in effectif
    ine_apprenant: any(),
    email_contact: any(),
    tel_apprenant: any(),
    code_commune_insee_apprenant: any(),
    siret_etablissement: any(),
    libelle_long_formation: any(),
    periode_formation: any(),
    annee_formation: any({ description: "Année de formation" }),
    formation_rncp: any(),

    contrat_date_debut: any(),
    contrat_date_fin: any(),
    contrat_date_rupture: any(),

    // internal fields
    source: string({
      description: "Source du dossier apprenant (Ymag, Gesti, TDB_MANUEL, TDB_FILE...)",
    }),
    effectif_id: objectId({ description: "Id de l'effectif associé" }),
    updated_at: date({ description: "Date de mise à jour en base de données" }),
    created_at: date({ description: "Date d'ajout en base de données" }),
    processed_at: date({ description: "Date de process des données" }),
    error: any({ description: "Erreur rencontré lors de la création de l'effectif" }),
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
  },
  {
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
