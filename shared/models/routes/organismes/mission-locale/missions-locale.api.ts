import { z } from "zod";

import {
  ACC_CONJOINT_MOTIF_ENUM,
  CFA_SITUATION_TYPE_ENUM,
  zAccConjointMotifEnum,
  zCfaRisqueRuptureEnum,
  zCfaSituationTypeEnum,
  zVerifiedInfo,
} from "../../../data/missionLocaleEffectif.model";
import { extensions } from "../../../parts/zodPrimitives";

// Schéma d'entrée strict pour la demande de collaboration : le téléphone de l'apprenant est
// obligatoire et son format est validé (via le standard partagé extensions.phone, libphonenumber).
// Volontairement distinct de zVerifiedInfo, qui reste permissif (telephone nullish) pour pouvoir
// continuer à relire les documents legacy stockés sans téléphone.
const zVerifiedInfoInput = zVerifiedInfo.extend({
  telephone: extensions.phone().refine((v) => !!v, { message: "Le numéro de téléphone est obligatoire" }),
});

export const FREINS_MOTIFS: ACC_CONJOINT_MOTIF_ENUM[] = [
  ACC_CONJOINT_MOTIF_ENUM.LOGEMENT,
  ACC_CONJOINT_MOTIF_ENUM.MOBILITE,
  ACC_CONJOINT_MOTIF_ENUM.SANTE,
  ACC_CONJOINT_MOTIF_ENUM.ADMINISTRATIF,
  ACC_CONJOINT_MOTIF_ENUM.FINANCE,
  ACC_CONJOINT_MOTIF_ENUM.SOCIAL_FAMILIAL,
];

const yearsAgo = (years: number) => {
  const date = new Date();
  date.setFullYear(date.getFullYear() - years);
  return date;
};

const zPastDate = (maxYearsAgo: number) =>
  z.coerce
    .date()
    .refine((value) => value <= new Date(), { message: "La date ne peut pas être dans le futur" })
    .refine((value) => value >= yearsAgo(maxYearsAgo), {
      message: `La date ne peut pas être antérieure à plus de ${maxYearsAgo} an(s)`,
    });

export const updateMissionLocaleEffectifOrganismeApi = {
  rupture: z.boolean(),
  acc_conjoint: z.boolean().optional(),
  motif: z.array(zAccConjointMotifEnum).optional(),
  commentaires: z.string().optional(),
  still_at_cfa: z.boolean().optional(),
  commentaires_par_motif: z.record(zAccConjointMotifEnum, z.string()).optional(),
  cause_rupture: z.string().optional(),
  referent_type: z.enum(["me", "other"]).optional(),
  referent_coordonnees: z.string().optional(),
  note_complementaire: z.string().optional(),
  verified_info: zVerifiedInfoInput.optional(),
  // Optionnel pour rester compatible avec les payloads du formulaire mono-page, qui ne le
  // transmettent pas. Sa présence déclenche les règles de cohérence par branche ci-dessous.
  situation_type: zCfaSituationTypeEnum.optional(),
  risque_rupture: zCfaRisqueRuptureEnum.optional(),
  date_abandon: zPastDate(1).optional(),
  date_rupture: zPastDate(1).optional(),
  date_debut_formation: zPastDate(4).optional(),
  recherche_entreprise: z.string().optional(),
  form_feedback: z
    .object({
      note: z.number().int().min(0).max(5).optional(),
      remarque: z.string().optional(),
    })
    .optional(),
};

type IUpdatePayload = z.infer<z.ZodObject<typeof updateMissionLocaleEffectifOrganismeApi>>;

const isBlank = (value: string | null | undefined) => !value || value.trim().length === 0;

const forbid = (
  ctx: z.RefinementCtx,
  payload: IUpdatePayload,
  fields: Array<keyof IUpdatePayload | "still_at_cfa">,
  situationLabel: string
) => {
  for (const field of fields) {
    if (payload[field] !== undefined) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: [field],
        message: `Ce champ n'est pas attendu pour un jeune ${situationLabel}`,
      });
    }
  }
};

const requireField = (ctx: z.RefinementCtx, condition: boolean, field: string, message: string) => {
  if (!condition) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: [field], message });
  }
};

export const zUpdateMissionLocaleEffectifOrganisme = z
  .strictObject(updateMissionLocaleEffectifOrganismeApi)
  .superRefine((payload, ctx) => {
    if (!payload.situation_type) {
      return;
    }

    switch (payload.situation_type) {
      case CFA_SITUATION_TYPE_ENUM.EN_CONTRAT:
        requireField(
          ctx,
          payload.risque_rupture !== undefined,
          "risque_rupture",
          "Le risque de rupture est obligatoire"
        );
        forbid(
          ctx,
          payload,
          ["date_rupture", "date_abandon", "date_debut_formation", "recherche_entreprise", "still_at_cfa"],
          "encore en contrat"
        );
        break;

      case CFA_SITUATION_TYPE_ENUM.RUPTURE_OU_SORTIE:
        requireField(
          ctx,
          payload.still_at_cfa !== undefined,
          "still_at_cfa",
          "Le maintien en formation est obligatoire"
        );
        requireField(ctx, payload.date_rupture !== undefined, "date_rupture", "La date de rupture est obligatoire");
        requireField(ctx, !isBlank(payload.cause_rupture), "cause_rupture", "La cause de la rupture est obligatoire");
        if (payload.still_at_cfa === false) {
          requireField(
            ctx,
            payload.date_abandon !== undefined,
            "date_abandon",
            "La date de sortie du CFA est obligatoire"
          );
        }
        if (payload.still_at_cfa === true) {
          forbid(ctx, payload, ["date_abandon"], "maintenu en formation");
        }
        if (payload.date_abandon && payload.date_rupture && payload.date_abandon < payload.date_rupture) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["date_abandon"],
            message: "La date de sortie du CFA ne peut pas précéder la date de rupture",
          });
        }
        break;

      case CFA_SITUATION_TYPE_ENUM.SANS_CONTRAT:
        requireField(
          ctx,
          payload.date_debut_formation !== undefined,
          "date_debut_formation",
          "La date de début de formation est obligatoire"
        );
        requireField(
          ctx,
          !isBlank(payload.recherche_entreprise),
          "recherche_entreprise",
          "La description de la recherche d'entreprise est obligatoire"
        );
        forbid(ctx, payload, ["still_at_cfa", "date_rupture", "date_abandon", "cause_rupture"], "sans contrat");
        break;
    }

    requireField(
      ctx,
      (payload.motif?.length ?? 0) >= 1,
      "motif",
      "Au moins un objectif d'accompagnement est obligatoire"
    );

    const motifsACommenter = [ACC_CONJOINT_MOTIF_ENUM.RECHERCHE_EMPLOI, ...FREINS_MOTIFS];
    for (const motif of payload.motif ?? []) {
      if (motifsACommenter.includes(motif) && isBlank(payload.commentaires_par_motif?.[motif])) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["commentaires_par_motif", motif],
          message: "Un commentaire est obligatoire pour cet objectif",
        });
      }
    }

    if (payload.referent_type === "other") {
      requireField(
        ctx,
        !isBlank(payload.referent_coordonnees),
        "referent_coordonnees",
        "Les coordonnées du référent sont obligatoires"
      );
    }

    requireField(
      ctx,
      !isBlank(payload.verified_info?.adresse_code_postal),
      "verified_info.adresse_code_postal",
      "Le code postal du jeune est obligatoire"
    );
    requireField(
      ctx,
      !isBlank(payload.verified_info?.adresse_commune),
      "verified_info.adresse_commune",
      "La commune du jeune est obligatoire"
    );
  });

export type IUpdateMissionLocaleEffectifOrganisme = z.output<
  z.ZodObject<typeof updateMissionLocaleEffectifOrganismeApi>
>;
