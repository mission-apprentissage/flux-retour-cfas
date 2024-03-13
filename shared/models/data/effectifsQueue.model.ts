import type { CreateIndexesOptions, IndexSpecification } from "mongodb";
import { z } from "zod";
import { zObjectId } from "zod-mongodb-schema";

import effectifsModel from "shared/models/data/effectifs.model";

import { CODES_STATUT_APPRENANT_ENUM } from "../../constants";
import { zAdresse } from "../parts/adresseSchema";

import { zContrat } from "./effectifs/contrat.part";
import { zFormationEffectif } from "./effectifs/formation.part";
import organismesModel from "./organismes.model";

const collectionName = "effectifsQueue";

const indexes: [IndexSpecification, CreateIndexesOptions][] = [
  [{ effectif_id: 1 }, { name: "effectif_id" }],
  [{ organisme_id: 1 }, { name: "organisme_id" }],
  [{ processed_at: 1 }, { name: "processed_at" }],
  [{ created_at: 1 }, { name: "created_at" }],
  [{ id_erp_apprenant: 1 }, { name: "id_erp_apprenant" }],
  [{ source: 1 }, { name: "source" }],
  [{ source_organisme_id: 1 }, { name: "source_organisme_id" }],
  [{ annee_scolaire: 1 }, { name: "annee_scolaire" }],
  [{ uai_etablissement: 1 }, { name: "uai_etablissement" }],
  [{ siret_etablissement: 1 }, { name: "siret_etablissement" }],
];

const effectifsProps = effectifsModel.zod.shape;
const formationProps = zFormationEffectif.shape;
const organismeProps = organismesModel.zod.shape;
const contratProps = zContrat.shape;
const apprenantProps = effectifsProps.apprenant.shape;

// internal fields (shared with api V3)
export const internalFields = {
  source: z.string({ description: effectifsProps.source.description }),
  source_organisme_id: z.string({ description: effectifsProps.source_organisme_id.description }).nullish(),
  effectif_id: zObjectId.describe("Id de l'effectif associé").nullish(),
  organisme_id: zObjectId.describe("Id de l'organisme associé").nullish(),
  updated_at: z.date({ description: "Date de mise à jour en base de données" }).nullish(),
  created_at: z.date({ description: "Date d'ajout en base de données" }),
  processed_at: z.date({ description: "Date de process des données" }).nullish(),
  error: z.any({ description: "Erreur rencontrée lors de la création de l'effectif" }).nullish(),
  api_version: z.string({ description: "Version de l'api utilisée (v2 ou v3)" }).nullish(),
  validation_errors: z
    .array(
      z
        .object({
          message: z.any({ description: "message d'erreur" }),
          path: z.any({ description: "champ en erreur" }),
        })
        .passthrough(),
      {
        description: "Erreurs de validation de cet effectif",
      }
    )
    .nullish(),
};

/**
 * Ce schéma est utilisé pour stocker et valider les données reçues.
 * Il ne contient aucune contrainte afin de pouvoir stocker toutes les données reçues.
 * Une premiere validation est effectuée lors de la réception des données, et les erreurs sont stockées dans le champ `validation_errors`.
 * Une 2eme validation plus poussée (SIRET, formation, ...) est effectuée au moment de la creation de l'effectif et l'erreur est stockée dans le champ `error`.
 */
export const zEffectifQueue = z.object({
  _id: zObjectId,
  // required fields to create an effectif
  nom_apprenant: z.any({ description: apprenantProps.nom.description }),
  prenom_apprenant: z.any({ description: apprenantProps.prenom.description }),
  date_de_naissance_apprenant: z.any({ description: apprenantProps.date_de_naissance.description }),
  uai_etablissement: z.any({ description: organismeProps.uai.description }), // This field is missing in V3
  nom_etablissement: z.any({ description: organismeProps.nom.description }), // This field is missing in V3
  id_formation: z.any({ description: formationProps.cfd.description }), // This field is missing in V3
  annee_scolaire: z.any({ description: effectifsProps.annee_scolaire.description }),
  statut_apprenant: z.any({ description: CODES_STATUT_APPRENANT_ENUM.join(",") }),
  date_metier_mise_a_jour_statut: z.any(),
  id_erp_apprenant: z.any({ description: effectifsProps.id_erp_apprenant.description }),
  // Optional fields in effectif
  ine_apprenant: z.any({ description: apprenantProps.ine.description }),
  email_contact: z.any({ description: apprenantProps.courriel.description }),
  tel_apprenant: z.any({ description: apprenantProps.telephone.description }),
  code_commune_insee_apprenant: z.any({ description: zAdresse.shape.code_insee.description }), // This field is missing in V3
  siret_etablissement: z.any({ description: organismeProps.siret.description }), // This field is missing in V3
  libelle_court_formation: z.any(), // This field is missing in V3
  libelle_long_formation: z.any({ description: formationProps.libelle_long.description }), // This field is missing in V3
  periode_formation: z.any({ description: formationProps.periode.description }), // This field is missing in V3
  annee_formation: z.any({ description: formationProps.annee.description }),
  formation_rncp: z.any({ description: formationProps.rncp.description }),

  contrat_date_debut: z.any({ description: contratProps.date_debut.description }),
  contrat_date_fin: z.any({ description: contratProps.date_fin.description }),
  contrat_date_rupture: z.any({ description: contratProps.date_rupture.description }),

  // V3 FIELDS
  // OPTIONAL FIELDS
  has_nir: z.boolean({ description: "Identification nationale securité social" }).nullish(),
  adresse_apprenant: z.any({ description: "Adresse de l'apprenant" }),
  code_postal_apprenant: z.any({ description: "Code postal de l'apprenant" }),
  code_postal_de_naissance_apprenant: z.any({ description: apprenantProps.code_postal_de_naissance.description }),
  sexe_apprenant: z.any({ description: apprenantProps.sexe.description }),
  rqth_apprenant: z.any({ description: "Reconnaissance de la Qualité de Travailleur Handicapé de l'apprenant" }),
  date_rqth_apprenant: z.any({ description: "Date de reconnaissance du RQTH de l'apprenant" }),
  responsable_apprenant_mail1: z.any({ description: "Mail du responsable de l'apprenant" }),
  responsable_apprenant_mail2: z.any({ description: "Mail du responsable de l'apprenant" }),
  derniere_situation: z.any({ description: "Situation de l'apprenant N-1" }),
  dernier_organisme_uai: z.any({
    description:
      "Numéro UAI de l’établissement fréquenté l’année dernière (N-1), si déjà en apprentissage, mettre l’UAI du site de formation ou département",
  }),
  type_cfa: z.any({ description: "Type de CFA (nomenclature SIFA)" }),
  obtention_diplome_formation: z.any(),
  date_obtention_diplome_formation: z.any({ description: formationProps.date_obtention_diplome.description }),
  date_exclusion_formation: z.any(),
  cause_exclusion_formation: z.any(),
  nom_referent_handicap_formation: z.any(),
  prenom_referent_handicap_formation: z.any(),
  email_referent_handicap_formation: z.any(),
  cause_rupture_contrat: z.any({ description: contratProps.cause_rupture.description }),
  contrat_date_debut_2: z.any({ description: "Date de début du contrat 2" }),
  contrat_date_fin_2: z.any({ description: "Date de fin du contrat 2" }),
  contrat_date_rupture_2: z.any({ description: "Date de rupture du contrat 2" }),
  cause_rupture_contrat_2: z.any({ description: "Cause de rupture du contrat 2" }),
  contrat_date_debut_3: z.any({ description: "Date de début du contrat 3" }),
  contrat_date_fin_3: z.any({ description: "Date de fin du contrat 3" }),
  contrat_date_rupture_3: z.any({ description: "Date de rupture du contrat 3" }),
  cause_rupture_contrat_3: z.any({ description: "Cause de rupture du contrat 3" }),
  contrat_date_debut_4: z.any({ description: "Date de début du contrat 4" }),
  contrat_date_fin_4: z.any({ description: "Date de fin du contrat 4" }),
  contrat_date_rupture_4: z.any({ description: "Date de rupture du contrat 4" }),
  cause_rupture_contrat_4: z.any({ description: "Cause de rupture du contrat 4" }),
  siret_employeur: z.any({ description: organismeProps.siret.description }),
  siret_employeur_2: z.any({ description: organismeProps.siret.description }),
  siret_employeur_3: z.any({ description: organismeProps.siret.description }),
  siret_employeur_4: z.any({ description: organismeProps.siret.description }),
  formation_presentielle: z.any({ description: "Formation 100% à distance ou non" }),

  // REQUIRED FIELDS
  date_inscription_formation: z.any({ description: formationProps.date_inscription.description }),
  date_entree_formation: z.any({ description: formationProps.date_entree.description }),
  date_fin_formation: z.any({ description: formationProps.date_fin.description }),
  // Legacy field, do not drop because it is still used by ERPs and old Excel import
  duree_theorique_formation: z.any({ description: "Durée théorique de la formation en années" }),
  // New field, prefer this.
  duree_theorique_formation_mois: z.any({ description: "Durée théorique de la formation en mois" }),

  etablissement_responsable_uai: z.any({ description: "UAI de l'établissement responsable" }),
  etablissement_responsable_siret: z.any({ description: "SIRET de l'établissement responsable" }),
  etablissement_formateur_uai: z.any({ description: "UAI de l'établissement formateur" }),
  etablissement_formateur_siret: z.any({ description: "SIRET de l'établissement formateur" }),
  etablissement_lieu_de_formation_uai: z.any({ description: "UAI de l'établissement (lieu de formation)" }),
  etablissement_lieu_de_formation_siret: z.any({ description: "SIRET de l'établissement (lieu de formation)" }),

  formation_cfd: z.any({ description: formationProps.cfd.description }),

  // internal fields
  ...internalFields,
});

export type IEffectifQueue = z.output<typeof zEffectifQueue>;

export default { zod: zEffectifQueue.passthrough(), indexes, collectionName };
