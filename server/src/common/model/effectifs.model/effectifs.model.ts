import { CreateIndexesOptions, IndexSpecification } from "mongodb";
import { uniqBy } from "lodash-es";
import { schemaValidation } from "../../utils/schemaUtils.js";
import { object, objectId, string, date, boolean, arrayOf } from "../json-schema/jsonSchemaTypes.js";
import { apprenantSchema, defaultValuesApprenant, validateApprenant } from "./parts/apprenant.part.js";

import { effectifFieldsLockerSchema, defaultValuesEffectifFieldsLocker } from "./parts/effectif.field.locker.part.js";
import {
  defaultValuesFormationEffectif,
  formationEffectifSchema,
  validateFormationEffectif,
} from "./parts/formation.effectif.part.js";
import { TETE_DE_RESEAUX } from "../../constants/networks.js";
import { ACADEMIES, DEPARTEMENTS, REGIONS } from "../../constants/territoires.js";
import { SIRET_REGEX_PATTERN, UAI_REGEX_PATTERN } from "@/common/constants/organisme.js";
import { Effectif } from "../@types/Effectif.js";

const collectionName = "effectifs";

const indexes: [IndexSpecification, CreateIndexesOptions][] = [
  [
    {
      organisme_id: 1,
      annee_scolaire: 1,
      id_erp_apprenant: 1,
      "apprenant.nom": 1,
      "apprenant.prenom": 1,
      "formation.cfd": 1,
      "formation.annee": 1,
    },
    { unique: true },
  ],
  [
    {
      "apprenant.nom": "text",
      "apprenant.prenom": "text",
      annee_scolaire: "text",
      id_erp_apprenant: "text",
    },
    {
      name: "nom_prenom_annsco_iderp_text",
      default_language: "french",
      collation: {
        locale: "simple", // simple binary comparison
        strength: 1, // case and accent insensitive
      },
    },
  ],
  [{ organisme_id: 1 }, { name: "organisme_id" }],
  [{ annee_scolaire: 1 }, { name: "annee_scolaire" }],
  [{ id_erp_apprenant: 1 }, { name: "id_erp_apprenant" }],
  [{ date_de_naissance: 1 }, { name: "date_de_naissance" }],
  [
    { "apprenant.nom": 1 },
    {
      name: "nom",
      collation: {
        locale: "fr",
        strength: 1, // case and accent insensitive
      },
    },
  ],
  [
    { "apprenant.prenom": 1 },
    {
      name: "prenom",
      collation: {
        locale: "fr",
        strength: 1, // case and accent insensitive
      },
    },
  ],
  [{ source: 1 }, { name: "source" }],
  [{ created_at: 1 }, { name: "created_at" }],
  [{ "_computed.organisme.region": 1 }, {}],
  [{ "_computed.organisme.departement": 1 }, {}],
  [{ "_computed.organisme.academie": 1 }, {}],
  [{ "_computed.organisme.reseaux": 1 }, {}],

  // 2 indexes utiles seulement pour les indicateurs v1
  // à supprimer avec les prochains dashboards indicateurs/effectifs pour utiliser organisme_id
  [{ "_computed.organisme.uai": 1 }, {}],
  [{ "_computed.organisme.siret": 1 }, {}],
];

export const schema = object(
  {
    _id: objectId(),
    organisme_id: objectId({
      description: "Organisme id",
    }),
    id_erp_apprenant: string({ description: "Identifiant de l'apprenant dans l'erp" }),
    source: string({
      description: "Source du dossier apprenant (Ymag, Gesti, TDB_MANUEL, TDB_FILE...)",
    }),

    annee_scolaire: string({
      description: `Année scolaire sur laquelle l'apprenant est enregistré (ex: "2020-2021")`,
      pattern: "^\\d{4}-\\d{4}$",
    }),

    apprenant: apprenantSchema,
    formation: formationEffectifSchema,

    is_lock: effectifFieldsLockerSchema,
    updated_at: date({ description: "Date de mise à jour en base de données" }),
    created_at: date({ description: "Date d'ajout en base de données" }),
    archive: boolean({ description: "Dossier apprenant est archivé (rétention maximum 5 ans)" }),
    validation_errors: arrayOf(
      object({
        fieldName: string({ description: "Nom du champ en erreur" }),
        type: string({ description: "Type d'erreur" }),
        inputValue: string({ description: "Valeur fournie en entrée" }),
        message: string({ description: "Message de l'erreur" }),
      }),
      {
        description: "Erreurs de validation de cet effectif",
      }
    ),
    _computed: object(
      {
        organisme: object({
          region: string({
            enum: REGIONS.map(({ code }) => code),
          }),
          departement: string({
            example: "1 Ain, 99 Étranger",
            pattern: "^([0-9][0-9]|2[AB]|9[012345]|97[1234678]|98[46789])$",
            enum: DEPARTEMENTS.map(({ code }) => code),
            maxLength: 3,
            minLength: 1,
          }),
          academie: string({
            enum: Object.values(ACADEMIES).map(({ code }) => `${code}`),
          }),
          reseaux: arrayOf(string({ enum: TETE_DE_RESEAUX.map((r) => r.key) })),

          // 2 champs utiles seulement pour les indicateurs v1
          // à supprimer avec les prochains dashboards indicateurs/effectifs pour utiliser organisme_id
          uai: string({
            pattern: UAI_REGEX_PATTERN,
            maxLength: 8,
            minLength: 8,
          }),
          siret: string({ pattern: SIRET_REGEX_PATTERN, maxLength: 14, minLength: 14 }),
        }),
      },
      {
        description: "Propriétés calculées ou récupérées d'autres collections",
      }
    ),
  },
  {
    required: ["apprenant", "id_erp_apprenant", "organisme_id", "source", "annee_scolaire"],
    additionalProperties: true,
  }
);

// Default value
export function defaultValuesEffectif({ lockAtCreate = false }) {
  return {
    apprenant: defaultValuesApprenant(),
    formation: defaultValuesFormationEffectif(),
    is_lock: defaultValuesEffectifFieldsLocker(lockAtCreate),
    validation_errors: [],
    updated_at: new Date(),
    created_at: new Date(),
  };
}

// TODO Extra validation
export function validateEffectif(props: Effectif, getErrors = false) {
  if (getErrors) {
    const errorsApprenant = validateApprenant(props.apprenant, getErrors);
    const errorsFormation = validateFormationEffectif(props.formation, getErrors);
    const entityValidation = schemaValidation({
      entity: props,
      schema,
      getErrors,
    });
    return uniqBy([...entityValidation, ...errorsApprenant, ...errorsFormation], "fieldName");
  }

  return schemaValidation({
    entity: {
      ...props,
      apprenant: validateApprenant(props.apprenant, getErrors),
      formation: validateFormationEffectif(props.formation, getErrors),
    },
    schema,
    getErrors,
  });
}

export default { schema, indexes, collectionName };
