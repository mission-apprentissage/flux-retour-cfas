import type { CreateIndexesOptions, IndexSpecification } from "mongodb";
import { z } from "zod";
import { zObjectId } from "zod-mongodb-schema";

const collectionName = "formationsCatalogue";

const indexes: [IndexSpecification, CreateIndexesOptions][] = [
  [{ cle_ministere_educatif: 1 }, { name: "cle_ministere_educatif", unique: true }],
  [{ intitule_long: 1 }, { name: "intitule_long" }],
  [{ cfd: 1 }, { name: "cfd" }],
  [{ rncp_code: 1 }, { name: "rncp_code" }],
  [{ etablissement_formateur_siret: 1, etablissement_formateur_uai: 1 }, { name: "etablissement_formateur_siret_uai" }],
  [
    { etablissement_gestionnaire_siret: 1, etablissement_gestionnaire_uai: 1 },
    { name: "etablissement_gestionnaire_siret_uai" },
  ],
  [{ etablissement_formateur_uai: 1 }, { name: "etablissement_formateur_uai" }],
  [{ etablissement_gestionnaire_uai: 1 }, { name: "etablissement_gestionnaire_uai" }],
];

const zFormationCatalogue = z.object({
  _id: zObjectId,
  cle_ministere_educatif: z.string(),
  cfd: z.string(),
  cfd_specialite: z.string().nullish(),
  cfd_outdated: z.boolean(),
  cfd_date_fermeture: z.string().nullish(),
  cfd_entree: z.string().nullish(),
  nom_academie: z.string().nullish(),
  num_academie: z.string().nullish(),
  code_postal: z.string(),
  code_commune_insee: z.string(),
  num_departement: z.string().nullish(),
  nom_departement: z.string().nullish(),
  region: z.string().nullish(),
  localite: z.string().nullish(),
  nom: z.string().nullish(),
  intitule_rco: z.string().nullish(),
  intitule_long: z.string().nullish(),
  intitule_court: z.string().nullish(),
  diplome: z.string().nullish(),
  niveau: z.string().nullish(),
  onisep_url: z.string().nullish(),
  onisep_intitule: z.string().nullish(),
  onisep_libelle_poursuite: z.string().nullish(),
  onisep_lien_site_onisepfr: z.string().nullish(),
  onisep_discipline: z.string().nullish(),
  onisep_domaine_sousdomaine: z.string().nullish(),
  rncp_code: z.string().nullable(),
  rncp_intitule: z.string().nullish(),
  rncp_eligible_apprentissage: z.boolean().nullish(),
  rncp_details: z
    .object({
      date_fin_validite_enregistrement: z.string().nullish(),
      active_inactive: z.string().nullish(),
      etat_fiche_rncp: z.string().nullish(),
      niveau_europe: z.string().nullish(),
      code_type_certif: z.string().nullish(),
      type_certif: z.string().nullish(),
      ancienne_fiche: z.array(z.string().nullish()).nullish(),
      nouvelle_fiche: z.array(z.string().nullish()).nullish(),
      demande: z.number().nullish(),
      certificateurs: z
        .array(
          z
            .object({
              certificateur: z.string().nullish(),
              siret_certificateur: z.string().nullish(),
            })
            .nullish()
        )
        .nullish(),
      nsf_code: z.string().nullish(),
      nsf_libelle: z.string().nullish(),
      romes: z
        .array(
          z
            .object({
              rome: z.string().nullish(),
              libelle: z.string().nullish(),
            })
            .nullish()
        )
        .nullish(),

      blocs_competences: z
        .array(
          z
            .object({
              numero_bloc: z.string().nullish(),
              intitule: z.string().nullish(),
              liste_competences: z.string().nullish(),
              modalites_evaluation: z.string().nullish(),
            })
            .nullish()
        )
        .nullish(),
      voix_acces: z.string().nullish(),
      partenaires: z
        .array(
          z
            .object({
              Nom_Partenaire: z.string().nullish(),
              Siret_Partenaire: z.string().nullish(),
              Habilitation_Partenaire: z.string().nullish(),
            })
            .nullish()
        )
        .nullish(),
      rncp_outdated: z.boolean().nullish(),
    })
    .nullish(),
  rome_codes: z.array(z.string().nullish()).nullish(),
  periode: z.array(z.string().nullish()).nullish(),
  capacite: z.string().nullish(),
  duree: z.string(),
  duree_incoherente: z.boolean().nullish(),
  annee: z.string(),
  annee_incoherente: z.boolean().nullish(),
  published: z.boolean().nullish(),
  forced_published: z.boolean().nullish(),
  distance: z.number().nullish(),
  lieu_formation_adresse: z.string(),
  lieu_formation_adresse_computed: z.string().nullish(),
  lieu_formation_siret: z.string().nullish(),
  id_rco_formation: z.string().nullish(),
  id_formation: z.string(),
  id_action: z.string().nullish(),
  ids_action: z.array(z.string().nullish()),
  id_certifinfo: z.string().nullish(),
  tags: z.array(z.string().nullish()),
  libelle_court: z.string().nullish(),
  niveau_formation_diplome: z.string().nullish(),
  distance_lieu_formation_etablissement_formateur: z.number().nullish(),
  niveau_entree_obligatoire: z.number().nullable(),
  entierement_a_distance: z.boolean(),
  france_competence_infos: z.any().nullish(),
  catalogue_published: z.boolean().nullish(),
  date_debut: z.array(z.string()).nullish(),
  date_fin: z.array(z.string()).nullish(),
  modalites_entrees_sorties: z.array(z.boolean().nullish()),
  id_RCO: z.string().nullish(),
  etablissement_gestionnaire_id: z.string().nullish(),
  etablissement_gestionnaire_siret: z.string(),
  etablissement_gestionnaire_enseigne: z.string().nullish(),
  etablissement_gestionnaire_uai: z.string().nullable(),
  etablissement_gestionnaire_published: z.boolean().nullish(),
  etablissement_gestionnaire_habilite_rncp: z.boolean().nullish(),
  etablissement_gestionnaire_certifie_qualite: z.boolean().nullish(),
  etablissement_gestionnaire_adresse: z.string().nullish(),
  etablissement_gestionnaire_code_postal: z.string().nullish(),
  etablissement_gestionnaire_code_commune_insee: z.string().nullish(),
  etablissement_gestionnaire_localite: z.string().nullish(),
  etablissement_gestionnaire_complement_adresse: z.string().nullish(),
  etablissement_gestionnaire_cedex: z.string().nullish(),
  etablissement_gestionnaire_entreprise_raison_sociale: z.string().nullish(),
  etablissement_gestionnaire_region: z.string().nullish(),
  etablissement_gestionnaire_num_departement: z.string().nullish(),
  etablissement_gestionnaire_nom_departement: z.string().nullish(),
  etablissement_gestionnaire_nom_academie: z.string().nullish(),
  etablissement_gestionnaire_num_academie: z.string().nullish(),
  etablissement_gestionnaire_siren: z.string().nullish(),
  etablissement_gestionnaire_nda: z.string().nullish(),
  etablissement_gestionnaire_date_creation: z.string().nullish(),
  etablissement_formateur_id: z.string().nullish(),
  etablissement_formateur_siret: z.string(),
  etablissement_formateur_enseigne: z.string().nullish(),
  etablissement_formateur_uai: z.string().nullable(),
  etablissement_formateur_published: z.boolean().nullish(),
  etablissement_formateur_habilite_rncp: z.boolean().nullish(),
  etablissement_formateur_certifie_qualite: z.boolean().nullish(),
  etablissement_formateur_adresse: z.string().nullish(),
  etablissement_formateur_code_postal: z.string().nullish(),
  etablissement_formateur_code_commune_insee: z.string().nullish(),
  etablissement_formateur_localite: z.string().nullish(),
  etablissement_formateur_complement_adresse: z.string().nullish(),
  etablissement_formateur_cedex: z.string().nullish(),
  etablissement_formateur_entreprise_raison_sociale: z.string().nullish(),
  etablissement_formateur_region: z.string().nullish(),
  etablissement_formateur_num_departement: z.string().nullish(),
  etablissement_formateur_nom_departement: z.string().nullish(),
  etablissement_formateur_nom_academie: z.string().nullish(),
  etablissement_formateur_num_academie: z.string().nullish(),
  etablissement_formateur_siren: z.string().nullish(),
  etablissement_formateur_nda: z.string().nullish(),
  etablissement_formateur_date_creation: z.string().nullish(),
  etablissement_reference: z.string().nullish(),
  etablissement_reference_published: z.boolean().nullish(),
  etablissement_reference_habilite_rncp: z.boolean().nullish(),
  etablissement_reference_certifie_qualite: z.boolean().nullish(),
  etablissement_reference_date_creation: z.string().nullish(),
  bcn_mefs_10: z
    .array(
      z
        .object({
          date_fermeture: z.string().nullish(),
          mef10: z.string().nullish(),
          modalite: z
            .object({
              duree: z.string().nullish(),
              annee: z.string().nullish(),
            })
            .nullish(),
        })
        .nullish()
    )
    .nullish(),
  lieu_formation_geo_coordonnees: z.string().nullish(),
  geo_coordonnees_etablissement_gestionnaire: z.string().nullish(),
  geo_coordonnees_etablissement_formateur: z.string().nullish(),
  idea_geo_coordonnees_etablissement: z.string().nullish(),
  created_at: z.string().nullish(),
  last_update_at: z.string().nullish(),
  lieu_formation_geo_coordonnees_computed: z.string().nullish(),
});

export type IFormationCatalogue = z.output<typeof zFormationCatalogue>;

// Add passthrough to allow extra properties in database, as it's an external API we are not sure they will not add new properties
// But doesn't allow extra properties in the code, do not use not referenced properties
export default { zod: zFormationCatalogue.passthrough(), indexes, collectionName };
