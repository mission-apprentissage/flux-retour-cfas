import { z } from "zod";

import { primitivesV1, primitivesV2 } from "@/common/validation/utils/zodPrimitives";

const dossierApprenantSchemaV3 = () =>
  z.object({
    apprenant: z.object({
      nom: primitivesV1.apprenant.nom,
      prenom: primitivesV1.apprenant.prenom,
      date_de_naissance: primitivesV1.apprenant.date_de_naissance,
      statut: primitivesV1.apprenant.statut,
      date_metier_mise_a_jour_statut: primitivesV1.apprenant.date_metier_mise_a_jour_statut,
      id_erp: primitivesV1.apprenant.id_erp,
      // V1 - OPTIONAL FIELDS
      ine: primitivesV1.apprenant.ine.optional(),
      email: primitivesV1.apprenant.email.optional(),
      telephone: primitivesV1.apprenant.telephone.optional(),
      code_commune_insee: primitivesV1.apprenant.code_commune_insee.optional(),
      // V3 - OPTIONAL FIELDS
      sexe: primitivesV2.apprenant.sexe.optional(),
      rqth: primitivesV2.apprenant.rqth.optional(),
      date_rqth: primitivesV2.apprenant.date_rqth.optional(),
    }),
    etablissement_responsable: z.object({
      siret: primitivesV1.etablissement_responsable.siret.optional(),
      uai: primitivesV1.etablissement_responsable.uai.optional(),
      nom: primitivesV1.etablissement_responsable.nom.optional(),
    }),
    etablissement_formateur: z.object({
      siret: primitivesV1.etablissement_formateur.siret.optional(),
      uai: primitivesV1.etablissement_formateur.uai.optional(),
      nom: primitivesV1.etablissement_formateur.nom.optional(),
      code_commune_insee: primitivesV1.etablissement_formateur.code_commune_insee.optional(),
    }),
    formation: z
      .object({
        libelle_court: primitivesV1.formation.libelle_court.optional(),
        libelle_long: primitivesV1.formation.libelle_long.optional(),
        periode: primitivesV1.formation.periode.optional(),
        annee_scolaire: primitivesV1.formation.annee_scolaire,
        annee: primitivesV1.formation.annee.optional(),
        code_rncp: primitivesV1.formation.code_rncp.optional(),
        code_cfd: primitivesV1.formation.code_cfd.optional(), // ancien id_formation
        // V3 - REQUIRED FIELDS
        date_inscription: primitivesV2.formation.date_inscription,
        date_entree: primitivesV2.formation.date_entree,
        date_fin: primitivesV2.formation.date_fin,
        // V3 - OPTIONAL FIELDS
        obtention_diplome: primitivesV2.formation.obtention_diplome.optional(),
        date_obtention_diplome: primitivesV2.formation.date_obtention_diplome.optional(),
        date_exclusion: primitivesV2.formation.date_exclusion.optional(),
        cause_exclusion: primitivesV2.formation.cause_exclusion.optional(),
        referent_handicap: z
          .object({
            nom: primitivesV2.formation.referent_handicap.nom.optional(),
            prenom: primitivesV2.formation.referent_handicap.prenom.optional(),
            email: primitivesV2.formation.referent_handicap.email.optional(),
          })
          .optional(),
      })
      .openapi({
        description: "Formation en cours de l'apprenant",
      }),
    contrat: z
      .object({
        date_debut: primitivesV1.contrat.date_debut.optional(),
        date_fin: primitivesV1.contrat.date_fin.optional(),
        date_rupture: primitivesV1.contrat.date_rupture.optional(),
        // V3 - OPTIONAL FIELDS
        cause_rupture: primitivesV2.contrat.cause_rupture.optional(),
      })
      .openapi({
        description: "Contrat en cours de l'apprenant",
      })
      .optional(),
    employeur: z
      .object({
        siret: primitivesV2.employeur.siret.optional(),
        code_commune_insee: primitivesV2.employeur.code_commune_insee.optional(),
        code_naf: primitivesV2.employeur.code_naf.optional(),
      })
      .optional()
      .openapi({
        description: "Informations sur l'employeur",
      }),
  });

export default dossierApprenantSchemaV3;
