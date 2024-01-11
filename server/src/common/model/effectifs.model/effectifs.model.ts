import { CreateIndexesOptions, IndexSpecification } from "mongodb";
import {
  ACADEMIES,
  DEPARTEMENTS,
  REGIONS,
  TETE_DE_RESEAUX,
  SIRET_REGEX_PATTERN,
  UAI_REGEX_PATTERN,
  YEAR_RANGE_PATTERN,
  any,
  arrayOf,
  boolean,
  date,
  object,
  objectId,
  string,
} from "shared";
import { Effectif } from "shared/models/data/@types";
import { apprenantSchema } from "shared/models/data/effectifs/apprenant.part";
import { contratSchema } from "shared/models/data/effectifs/contrat.part";
import { formationEffectifSchema } from "shared/models/data/effectifs/formation.part";
import { PartialDeep } from "type-fest";

import { defaultValuesApprenant } from "./parts/apprenant.part";
import { defaultValuesEffectifFieldsLocker } from "./parts/effectif.field.locker.part";
import { defaultValuesFormationEffectif } from "./parts/formation.effectif.part";

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
  [{ organisme_id: 1, created_at: 1 }, {}],
  [{ annee_scolaire: 1 }, { name: "annee_scolaire" }],
  [{ id_erp_apprenant: 1 }, { name: "id_erp_apprenant" }],
  [{ date_de_naissance: 1 }, { name: "date_de_naissance" }],
  [{ "formation.cfd": 1 }, { name: "formation.cfd" }],
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
  [{ source_organisme_id: 1 }, { name: "source_organisme_id" }],
  [{ created_at: 1 }, { name: "created_at" }],
  [{ "_computed.organisme.region": 1 }, {}],
  [{ "_computed.organisme.departement": 1 }, {}],
  [{ "_computed.organisme.academie": 1 }, {}],
  [{ "_computed.organisme.bassinEmploi": 1 }, {}],
  [{ "_computed.organisme.reseaux": 1 }, {}],
  [{ "_computed.organisme.uai": 1 }, {}],
  [{ "_computed.organisme.siret": 1 }, {}],
  [{ "_computed.organisme.fiable": 1, annee_scolaire: 1 }, {}],
  [{ "_computed.formation.codes_rome": 1 }, {}],
  [{ "_computed.formation.opcos": 1 }, {}],
];

export const schema = object(
  {
    _id: objectId({ description: "Identifiant MongoDB de l'effectif" }),
    organisme_id: objectId({ description: "Organisme id (lieu de formation de l'apprenant pour la v3)" }),
    organisme_responsable_id: objectId({ description: "Organisme responsable id" }),
    organisme_formateur_id: objectId({ description: "Organisme formateur id" }),

    id_erp_apprenant: string({ description: "Identifiant de l'apprenant dans l'erp" }),
    source: string({ description: "Source du dossier apprenant (Ymag, Gesti, TDB_MANUEL, TDB_FILE...)" }),
    source_organisme_id: string({ description: "Identifiant de l'organisme id source transmettant" }),
    annee_scolaire: string({
      description: `Année scolaire sur laquelle l'apprenant est enregistré (ex: "2020-2021")`,
      pattern: YEAR_RANGE_PATTERN,
    }),
    apprenant: apprenantSchema,
    formation: formationEffectifSchema,
    contrats: arrayOf(contratSchema, {
      // Note: anciennement dans apprenant.contrats
      description: "Historique des contrats de l'apprenant",
    }),
    is_lock: any({ description: "Indique les champs verrouillés" }),
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
            enum: ACADEMIES.map(({ code }) => code),
          }),
          reseaux: arrayOf(string({ enum: TETE_DE_RESEAUX.map((r) => r.key) })),
          bassinEmploi: string({}),

          // 2 champs utiles seulement pour les indicateurs v1
          // à supprimer avec les prochains dashboards indicateurs/effectifs pour utiliser organisme_id
          uai: string({
            pattern: UAI_REGEX_PATTERN,
            maxLength: 8,
            minLength: 8,
          }),
          siret: string({ pattern: SIRET_REGEX_PATTERN, maxLength: 14, minLength: 14 }),
          fiable: boolean({ description: `organismes.fiabilisation_statut == "FIABLE" && ferme != false` }),
        }),
        formation: object({
          codes_rome: arrayOf(string()),
          opcos: arrayOf(string()),
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
export function defaultValuesEffectif() {
  return {
    apprenant: defaultValuesApprenant(),
    contrats: [],
    formation: defaultValuesFormationEffectif(),
    is_lock: defaultValuesEffectifFieldsLocker(),
    validation_errors: [],
    _computed: {},
    updated_at: new Date(),
    created_at: new Date(),
  } satisfies PartialDeep<Effectif>;
}

export default { schema, indexes, collectionName };
