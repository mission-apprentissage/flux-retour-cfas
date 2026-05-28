import { z } from "zod";

const zStatWithVariation = z.object({
  current: z.number(),
  variation: z.string(),
});

const zRegionRow = z.object({
  region_code: z.string(),
  region_nom: z.string(),
  cfa_compatibles: z.number(),
  cfa_actives: z.object({ current: z.number(), delta: z.number() }),
  cfa_with_collab: z.object({ current: z.number(), delta: z.number() }),
  rupturants: z.number(),
  dossiers_envoyes_cfa: z.number(),
});

export const zCollaborationStatsResponse = z.object({
  evaluation_date: z.date(),
  cutoff_date: z.date(),
  national: z.object({
    activation: z.object({
      cfa_compatibles: zStatWithVariation,
      cfa_actives: zStatWithVariation,
      cfa_with_collab: zStatWithVariation,
    }),
    usage: z.object({
      rupturants: zStatWithVariation,
      dossiers_envoyes_cfa: zStatWithVariation,
      dossiers_traites_ml: zStatWithVariation,
      jeunes_repondus: zStatWithVariation,
      rdv_pris: zStatWithVariation,
    }),
  }),
  regions: z.array(zRegionRow),
});

export type ICollaborationStatsResponseSchema = z.output<typeof zCollaborationStatsResponse>;

const zCfaCompatibleExportRow = z.object({
  siret: z.string(),
  nom: z.string().nullable(),
  region: z.string().nullable(),
});

const zCfaActiveExportRow = z.object({
  siret: z.string(),
  nom: z.string().nullable(),
  region: z.string().nullable(),
  date_activation: z.date(),
  sources: z.string(),
});

const zCfaWithCollabExportRow = z.object({
  siret: z.string(),
  nom: z.string().nullable(),
  region: z.string().nullable(),
  nb_collaborations: z.number(),
});

const zCollaborationDetailRow = z.object({
  siret_cfa: z.string().nullable(),
  nom_cfa: z.string().nullable(),
  region_cfa: z.string().nullable(),
  nom_ml: z.string().nullable(),
  nom_jeune: z.string().nullable(),
  prenom_jeune: z.string().nullable(),
  date_naissance_jeune: z.date().nullable(),
  statut_apprenant: z.string().nullable(),
  dossier_envoye: z.enum(["Oui", "Non"]),
  date_envoi_cfa: z.date().nullable(),
  dossier_traite: z.enum(["Oui", "Non"]),
  date_traitement_ml: z.date().nullable(),
  reponse_jeune: z.enum(["Oui", "Non"]),
  rdv_pris: z.enum(["Oui", "Non"]),
  source: z.enum(["DECA", "ERP"]).nullable(),
});

export const zCollaborationExportResponse = z.object({
  cfa_compatibles: z.array(zCfaCompatibleExportRow),
  cfa_actives: z.array(zCfaActiveExportRow),
  cfa_with_collab: z.array(zCfaWithCollabExportRow),
  details_collaborations: z.array(zCollaborationDetailRow),
});

export type ICollaborationExportResponseSchema = z.output<typeof zCollaborationExportResponse>;
