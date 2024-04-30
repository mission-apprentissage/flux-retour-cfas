import type { CreateIndexesOptions, IndexSpecification } from "mongodb";
import { z } from "zod";
import { zObjectId } from "zod-mongodb-schema";

import {
  SIRET_REGEX,
  STATUT_APPRENANT,
  STATUT_APPRENANT_VALUES,
  TETE_DE_RESEAUX_BY_ID,
  UAI_REGEX,
  YEAR_RANGE_REGEX,
} from "../../constants";
import { zodEnumFromArray, zodEnumFromObjKeys } from "../../utils/zodHelper";
import { zAdresse } from "../parts/adresseSchema";

import { zApprenant } from "./effectifs/apprenant.part";
import { zContrat } from "./effectifs/contrat.part";
import { zFormationEffectif } from "./effectifs/formation.part";

const collectionName = "effectifsDECA";

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

const StatutApprenantEnum = zodEnumFromArray(
  STATUT_APPRENANT_VALUES as (typeof STATUT_APPRENANT)[keyof typeof STATUT_APPRENANT][]
);

const zEffectifComputedStatut = z.object({
  en_cours: StatutApprenantEnum,
  historique: z.array(
    z.object({
      mois: z.string(),
      annee: z.string(),
      valeur: StatutApprenantEnum,
    })
  ),
  parcours: z.array(
    z.object({
      date: z.date(),
      valeur: StatutApprenantEnum,
    })
  ),
});

export const zEffectifDECA = z.object({
  _id: zObjectId.describe("Identifiant MongoDB de l'effectifDeca"),
  organisme_id: zObjectId.describe("Organisme id (lieu de formation de l'apprenant pour la v3)"),
  organisme_responsable_id: zObjectId.describe("Organisme responsable id").nullish(),
  organisme_formateur_id: zObjectId.describe("Organisme formateur id").nullish(),

  id_erp_apprenant: z.string({
    description: "Identifiant de l'apprenant dans l'erp",
  }),
  source: z.string({
    description: "Source du dossier apprenant (Ymag, Gesti, TDB_MANUEL, TDB_FILE...)",
  }),
  source_organisme_id: z
    .string({
      description: "Identifiant de l'organisme id source transmettant",
    })
    .nullish(),
  annee_scolaire: z
    .string({
      description: `Année scolaire sur laquelle l'apprenant est enregistré (ex: "2020-2021")`,
    })
    .regex(YEAR_RANGE_REGEX),
  apprenant: zApprenant,
  formation: zFormationEffectif.nullish(),
  contrats: z
    .array(zContrat, {
      // Note: anciennement dans apprenant.contrats
      description: "Historique des contrats de l'apprenant",
    })
    .nullish(),
  // TODO: remove any
  is_lock: z.any(),

  updated_at: z.date({ description: "Date de mise à jour en base de données" }).nullish(),
  created_at: z.date({ description: "Date d'ajout en base de données" }).nullish(),
  archive: z
    .boolean({
      description: "Dossier apprenant est archivé (rétention maximum 5 ans)",
    })
    .nullish(),
  validation_errors: z
    .array(
      z.object({
        fieldName: z.string({ description: "Nom du champ en erreur" }).nullish(),
        type: z.string({ description: "Type d'erreur" }).nullish(),
        inputValue: z.string({ description: "Valeur fournie en entrée" }).nullish(),
        message: z.string({ description: "Message de l'erreur" }).nullish(),
      }),
      {
        description: "Erreurs de validation de cet effectif",
      }
    )
    .nullish(),
  _computed: z
    .object(
      {
        organisme: z
          .object({
            region: zAdresse.shape.region.nullish(),
            departement: zAdresse.shape.departement.nullish(),
            academie: zAdresse.shape.academie.nullish(),
            reseaux: z
              .array(zodEnumFromObjKeys(TETE_DE_RESEAUX_BY_ID))
              .describe("Réseaux du CFA, s'ils existent")
              .nullish(),
            bassinEmploi: z.string({}).nullish(),

            // 2 champs utiles seulement pour les indicateurs v1
            // à supprimer avec les prochains dashboards indicateurs/effectifs pour utiliser organisme_id
            uai: z
              .string({
                description: "Code UAI de l'établissement",
              })
              .regex(UAI_REGEX)
              .nullish(),
            siret: z
              .string({
                description: "N° SIRET de l'établissement",
              })
              .regex(SIRET_REGEX)
              .nullish(),
            fiable: z
              .boolean({
                description: `organismes.fiabilisation_statut == "FIABLE" && ferme != false`,
              })
              .nullish(),
          })
          .nullish(),
        formation: z
          .object({
            codes_rome: z.array(z.string()).nullish(),
            opcos: z.array(z.string()).nullish(),
          })
          .nullish(),
        // @TODO: nullish en attendant la migration et passage en nullable ensuite (migration: 20240305085918-effectifs-types.ts)
        statut: zEffectifComputedStatut.nullish(),
      },
      {
        description: "Propriétés calculées ou récupérées d'autres collections",
      }
    )
    .nullish(),
  is_deca_compatible: z.boolean().nullish(),
});

export type IEffectifDECA = z.output<typeof zEffectifDECA>;
export type IEffectifComputedStatut = z.output<typeof zEffectifComputedStatut>;
export type IEffectifApprenant = z.infer<typeof zApprenant>;

export default { zod: zEffectifDECA, indexes, collectionName };
