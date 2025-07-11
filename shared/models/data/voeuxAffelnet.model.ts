import type { CreateIndexesOptions, IndexSpecification } from "mongodb";
import { z } from "zod";
import { zObjectId } from "zod-mongodb-schema";

import { SIRET_REGEX, UAI_REGEX, YEAR_REGEX } from "../../constants";
import { zAdresse } from "../parts/adresseSchema";

const collectionName = "voeuxAffelnet";

const indexes: [IndexSpecification, CreateIndexesOptions][] = [
  [{ voeu_id: 1 }, {}],
  [{ revision: -1 }, {}],
  [{ "raw.ine": 1 }, {}],
  [{ deleted_at: 1 }, {}],
];

const zVoeuAffelnetRaw = z.object({
  academie: z.any().nullish(),
  ine: z.any().nullish(),
  nom: z.any().nullish(),
  prenom_1: z.any().nullish(),
  prenom_2: z.any().nullish(),
  prenom_3: z.any().nullish(),
  adresse_1: z.any().nullish(),
  adresse_2: z.any().nullish(),
  adresse_3: z.any().nullish(),
  adresse_4: z.any().nullish(),
  code_postal: z.any().nullish(),
  ville: z.any().nullish(),
  pays: z.any().nullish(),
  telephone: z.any().nullish(),
  telephone_pro: z.any().nullish(),
  telephone_portable: z.any().nullish(),
  telephone_responsable_1: z.any().nullish(),
  telephone_responsable_2: z.any().nullish(),
  mail_responsable_1: z.any().nullish(),
  mail_responsable_2: z.any().nullish(),
  mnemonique_mef_origine: z.any().nullish(),
  code_mef_origine: z.any().nullish(),
  libelle_formation_origine: z.any().nullish(),
  code_origine_1: z.any().nullish(),
  libelle_option_1: z.any().nullish(),
  code_origine_2: z.any().nullish(),
  libelle_option_2: z.any().nullish(),
  code_lv1: z.any().nullish(),
  libelle_lv1: z.any().nullish(),
  code_lv2: z.any().nullish(),
  libelle_lv2: z.any().nullish(),
  code_uai_etab_origine: z.any().nullish(),
  type_etab_origine: z.any().nullish(),
  libelle_etab_origine: z.any().nullish(),
  ville_etab_origine: z.any().nullish(),
  code_uai_cio_origine: z.any().nullish(),
  libelle_cio_origine: z.any().nullish(),
  rang: z.any().nullish(),
  code_offre_formation: z.any().nullish(),
  code_mef: z.any().nullish(),
  bareme: z.any().nullish(),
  mnemonique_mef_offre_formation: z.any().nullish(),
  code_specialite_offre_formation: z.any().nullish(),
  libelle_formation: z.any().nullish(),
  code_enseignement: z.any().nullish(),
  libelle_enseignement: z.any().nullish(),
  candidature_internat: z.any().nullish(),
  demande_code_lv1: z.any().nullish(),
  demande_libelle_lv1: z.any().nullish(),
  demande_code_lv2: z.any().nullish(),
  demande_libelle_lv2: z.any().nullish(),
  code_uai_etab_accueil: z.any().nullish(),
  type_etab_accueil: z.any().nullish(),
  libelle_etab_accueil: z.any().nullish(),
  ville_etab_accueil: z.any().nullish(),
  siret_uai_gestionnaire: z.any().nullish(),
  cle_ministere_educatif: z.any().nullish(),
  uai_cio_etab_accueil: z.any().nullish(),
  uai_etatblissement_formateur: z.any().nullish(),
  uai_etablissement_responsable: z.any().nullish(),
  libelle_public_etablissement: z.any().nullish(),
  annee_scolaire_rentree: z.any().nullish(),
});
const zVoeuAffelnet = z.object({
  _id: zObjectId.describe("Identifiant unique MongoDB de l'instance voeu"),
  organisme_formateur_id: zObjectId.describe("Identifiant de l'organisme formateur").nullish(),
  organisme_responsable_id: zObjectId.describe("Identifiant de l'organisme responsable").nullish(),
  effectif_id: zObjectId.describe("Identifiant de l'effectif").nullish(),
  effectif_deca_id: zObjectId.describe("Identifiant de l'effectif DECA").nullish(),
  created_at: z.date({ description: "Date d'ajout en base de données" }),
  updated_at: z.date({ description: "Date de mise à jour" }),
  deleted_at: z.date({ description: "Date de suppresion du voeux" }).nullish(),
  is_contacted: z.boolean({ description: "Indique si le jeune a été contacté" }),
  formation_catalogue_id: zObjectId.nullish(),
  academie_code: z.string().nullish().describe("Code de l'académie du voeu"),
  annee_scolaire_rentree: z
    .string({
      description: `Année scolaire du voeux`,
    })
    .regex(YEAR_REGEX)
    .nullish(),
  raw: zVoeuAffelnetRaw,
  history: z.array(
    z.object({
      created_at: z.date(),
      raw: zVoeuAffelnetRaw,
    })
  ),
  _computed: z.object({
    formation: z.object({
      libelle: z.string().nullish(),
      rncp: z.string().nullish(),
      cfd: z.string().nullish(),
    }),
    organisme: z
      .object({
        region: zAdresse.shape.region.nullish(),
        departement: zAdresse.shape.departement.nullish(),
        academie: zAdresse.shape.academie.nullish(),
        reseaux: z.array(z.string()).describe("Réseaux du CFA, s'ils existent").nullish(),
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
  }),
});

export type IVoeuAffelnet = z.output<typeof zVoeuAffelnet>;
export type IVoeuAffelnetRaw = z.output<typeof zVoeuAffelnet.shape.raw>;
export default { zod: zVoeuAffelnet, indexes, collectionName };
