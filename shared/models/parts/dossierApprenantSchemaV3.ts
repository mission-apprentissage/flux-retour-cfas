import { z } from "zod";

import { extensions, primitivesV1, primitivesV3 } from "./zodPrimitives";

export const stripModelAdditionalKeys = (validationSchema: any, data: any) => {
  const strippedData = Object.keys(validationSchema.shape).reduce((acc, curr) => {
    return data[curr] !== undefined
      ? {
          ...acc,
          [curr]: data[curr],
        }
      : acc;
  }, {} as any);

  delete strippedData._id;

  return strippedData;
};

export const dossierApprenantSchemaV3Base = z.object({
  // REQUIRED FIELDS
  nom_apprenant: primitivesV1.apprenant.nom,
  prenom_apprenant: primitivesV1.apprenant.prenom,
  date_de_naissance_apprenant: primitivesV1.apprenant.date_de_naissance,
  // The following fields are missing in V3
  // uai_etablissement: primitivesV1.etablissement_responsable.uai,
  // nom_etablissement: primitivesV1.etablissement_responsable.nom,
  // id_formation: primitivesV1.formation.code_cfd,
  annee_scolaire: primitivesV1.formation.annee_scolaire,
  statut_apprenant: primitivesV1.apprenant.statut.nullish(),
  date_metier_mise_a_jour_statut: primitivesV1.apprenant.date_metier_mise_a_jour_statut.nullish(),
  id_erp_apprenant: primitivesV1.apprenant.id_erp,

  // OPTIONAL FIELDS
  ine_apprenant: primitivesV1.apprenant.ine.optional(),
  email_contact: extensions.emailWithFallback().optional(),
  tel_apprenant: z.preprocess((v) => (v ? String(v) : null), z.string().nullable()).nullish(),
  // The following field is missing in V3
  // siret_etablissement: primitivesV1.etablissement_responsable.siret.optional(),
  libelle_court_formation: primitivesV1.formation.libelle_court.optional(),
  // The following field are missing in V3
  // libelle_long_formation: primitivesV1.formation.libelle_long.optional(),
  // periode_formation: primitivesV1.formation.periode.nullish(),
  annee_formation: primitivesV1.formation.annee.optional(),
  formation_rncp: primitivesV1.formation.code_rncp.optional(),
  contrat_date_debut: primitivesV1.contrat.date_debut.optional(),
  contrat_date_fin: primitivesV1.contrat.date_fin.optional(),
  contrat_date_rupture: primitivesV1.contrat.date_rupture.optional(),

  custom_statut_apprenant: primitivesV3.custom_statut_apprenant.optional(),
  // V3 FIELDS
  // OPTIONAL FIELDS
  has_nir: primitivesV3.apprenant.has_nir.optional(),
  adresse_apprenant: primitivesV3.apprenant.adresse.optional(),

  code_postal_apprenant: primitivesV3.apprenant.code_postal.optional(),
  code_postal_de_naissance_apprenant: z.coerce.string().optional(),
  code_commune_insee_apprenant: primitivesV1.apprenant.code_commune_insee.optional(),
  code_commune_insee_de_naissance_apprenant: primitivesV1.apprenant.code_commune_insee.optional(),

  sexe_apprenant: primitivesV3.apprenant.sexe.optional(),
  rqth_apprenant: primitivesV3.apprenant.rqth.optional(),
  date_rqth_apprenant: primitivesV3.apprenant.date_rqth.optional(),
  responsable_apprenant_mail1: primitivesV3.responsable.email.optional(),
  responsable_apprenant_mail2: primitivesV3.responsable.email.optional(),
  obtention_diplome_formation: primitivesV3.formation.obtention_diplome.optional(),
  date_obtention_diplome_formation: primitivesV3.formation.date_obtention_diplome.optional(),
  date_exclusion_formation: primitivesV3.formation.date_exclusion.optional(),
  cause_exclusion_formation: primitivesV3.formation.cause_exclusion.optional(),
  nom_referent_handicap_formation: primitivesV3.formation.referent_handicap.nom.optional(),
  prenom_referent_handicap_formation: primitivesV3.formation.referent_handicap.prenom.optional(),
  email_referent_handicap_formation: primitivesV3.formation.referent_handicap.email.optional(),
  cause_rupture_contrat: primitivesV3.contrat.cause_rupture.optional(),
  contrat_date_debut_2: primitivesV1.contrat.date_debut.optional(),
  contrat_date_fin_2: primitivesV1.contrat.date_fin.optional(),
  contrat_date_rupture_2: primitivesV1.contrat.date_rupture.optional(),
  cause_rupture_contrat_2: primitivesV3.contrat.cause_rupture.optional(),
  contrat_date_debut_3: primitivesV1.contrat.date_debut.optional(),
  contrat_date_fin_3: primitivesV1.contrat.date_fin.optional(),
  contrat_date_rupture_3: primitivesV1.contrat.date_rupture.optional(),
  cause_rupture_contrat_3: primitivesV3.contrat.cause_rupture.optional(),
  contrat_date_debut_4: primitivesV1.contrat.date_debut.optional(),
  contrat_date_fin_4: primitivesV1.contrat.date_fin.optional(),
  contrat_date_rupture_4: primitivesV1.contrat.date_rupture.optional(),
  cause_rupture_contrat_4: primitivesV3.contrat.cause_rupture.optional(),
  siret_employeur: extensions.siretWithFallback().optional(),
  siret_employeur_2: extensions.siretWithFallback().optional(),
  siret_employeur_3: extensions.siretWithFallback().optional(),
  siret_employeur_4: extensions.siretWithFallback().optional(),
  formation_presentielle: primitivesV3.formation.presentielle.optional(),
  // These two fields should have been required but sometimes, it is missing in YMAG
  duree_theorique_formation: extensions.numberOrNull(1, 4),
  duree_theorique_formation_mois: extensions.numberOrNull(1, 48),

  // REQUIRED FIELDS
  date_inscription_formation: primitivesV3.formation.date_inscription,
  date_entree_formation: primitivesV3.formation.date_entree,
  date_fin_formation: primitivesV3.formation.date_fin,

  etablissement_responsable_uai: primitivesV1.etablissement_responsable.uai,
  etablissement_responsable_siret: primitivesV1.etablissement_responsable.siret,
  etablissement_formateur_uai: primitivesV1.etablissement_formateur.uai,
  etablissement_formateur_siret: primitivesV1.etablissement_formateur.siret,
  etablissement_lieu_de_formation_uai: primitivesV1.etablissement_lieu_de_formation.uai.optional(),
  etablissement_lieu_de_formation_siret: z.coerce.string().optional(),
  etablissement_lieu_de_formation_adresse: primitivesV1.etablissement_lieu_de_formation.adresse.optional(),
  etablissement_lieu_de_formation_code_postal: primitivesV1.etablissement_lieu_de_formation.code_postal.optional(),

  formation_cfd: primitivesV1.formation.code_cfd.nullish(),
  // Champs SIFA
  derniere_situation: primitivesV3.derniere_situation.optional(),
  dernier_organisme_uai: primitivesV3.dernier_organisme_uai.optional(),
  type_cfa: primitivesV3.type_cfa.optional(),
});

const dossierApprenantSchemaV3 = dossierApprenantSchemaV3Base.merge(
  z.object({
    // These fields are hidden in documentation because they are generated by the API itself.
    api_version: primitivesV1.api_version.optional(),
    source: primitivesV1.source,
    source_organisme_id: primitivesV1.source_organisme_id.optional(),
  })
);

export const dossierApprenantSchemaV3Input = dossierApprenantSchemaV3Base
  .merge(
    z.object({
      nir_apprenant: z
        .preprocess(
          (v: any) => (v ? String(v).replace(/[\s.-]+/g, "") : v),
          z
            .any()
            // On indique juste "13 chiffres attendus", car ça ne devrait pas être 15 (on répare silencieusement quand même à la ligne suivante)
            .describe("NIR de l'apprenant")
            .openapi({
              example: "1234567890123",
              type: "string",
            })
            .transform<boolean>(Boolean)
        )
        .optional(),
      // These fields are hidden in documentation because they are generated by the API itself.
      api_version: primitivesV1.api_version.optional(),
      source: primitivesV1.source,
      source_organisme_id: primitivesV1.source_organisme_id.optional(),
    })
  )
  .omit({
    has_nir: true,
  });

// Utilisé par le téléversement manuel. Le but côté métier est d'obliger les utilisateurs à remplir des champs dont
// ils pourraient avoir besoin dans SIFA alors que ce n'est pas toujours présent côté ERPs.
// Source de la décision: https://mission-apprentissage.slack.com/archives/C02FR2L1VB8/p1693232432865229
const dossierApprenantSchemaV3WithMoreRequiredFields = dossierApprenantSchemaV3Base.merge(
  z.object({
    email_contact: primitivesV1.apprenant.email,
    adresse_apprenant: primitivesV3.apprenant.adresse,
    code_postal_apprenant: primitivesV3.apprenant.code_postal,
    sexe_apprenant: primitivesV3.apprenant.sexe,
    annee_formation: primitivesV1.formation.annee,
  })
);

export function dossierApprenantSchemaV3WithMoreRequiredFieldsValidatingUAISiret(
  invalidsUais: string[],
  invalidsSirets: string[]
) {
  const validateUAI = (uai: string) => !invalidsUais.includes(uai);
  const validateSiret = (siret: string) => !invalidsSirets.includes(siret);
  const messageUai = "UAI non valide";
  const messageSiret = "Siret non valide";

  return dossierApprenantSchemaV3WithMoreRequiredFields.merge(
    z.object({
      etablissement_responsable_uai: primitivesV1.etablissement_responsable.uai.refine(validateUAI, {
        message: messageUai,
      }),
      etablissement_responsable_siret: primitivesV1.etablissement_responsable.siret.refine(validateSiret, {
        message: messageSiret,
      }),
      etablissement_formateur_uai: primitivesV1.etablissement_formateur.uai.refine(validateUAI, {
        message: messageUai,
      }),
      etablissement_formateur_siret: primitivesV1.etablissement_formateur.siret.refine(validateSiret, {
        message: messageSiret,
      }),
    })
  );
}

export function computeWarningsForDossierApprenantSchemaV3(data: Array<IDossierApprenantSchemaV3>) {
  return {
    contratCount: countContratWarning(data),
  };
}

const countContratWarning = (data: Array<IDossierApprenantSchemaV3>) => {
  return data.reduce(
    (acc: number, { contrat_date_debut, contrat_date_debut_2, contrat_date_debut_3, contrat_date_debut_4 }) => {
      return !contrat_date_debut && !contrat_date_debut_2 && !contrat_date_debut_3 && !contrat_date_debut_4
        ? acc + 1
        : acc;
    },
    0
  );
};

export type IDossierApprenantSchemaV3 = z.output<typeof dossierApprenantSchemaV3>;

export default dossierApprenantSchemaV3;
