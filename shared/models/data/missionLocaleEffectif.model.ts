import type { CreateIndexesOptions, IndexSpecification } from "mongodb";
import { z } from "zod";
import { zObjectId } from "zod-mongodb-schema";

import { zEffectif, zStatutApprenantEnum } from "./effectifs.model";
import { zEffectifDECA } from "./effectifsDECA.model";

const collectionName = "missionLocaleEffectif";

const indexes: [IndexSpecification, CreateIndexesOptions][] = [
  [{ mission_locale_id: 1, effectif_id: 1 }, { unique: true }],
];

export enum SITUATION_ENUM {
  RDV_PRIS = "RDV_PRIS",
  NOUVEAU_PROJET = "NOUVEAU_PROJET",
  DEJA_ACCOMPAGNE = "DEJA_ACCOMPAGNE",
  CONTACTE_SANS_RETOUR = "CONTACTE_SANS_RETOUR",
  COORDONNEES_INCORRECT = "COORDONNEES_INCORRECT",
  AUTRE = "AUTRE",
}

export enum API_SITUATION_ENUM {
  NON_TRAITE = "NON_TRAITE",
}

export enum SITUATION_LABEL_ENUM {
  RDV_PRIS = "Rendez-vous pris à la Mission Locale",
  NOUVEAU_PROJET = "Nouveau projet en cours",
  DEJA_ACCOMPAGNE = "Déjà accompagné par la Mission Locale et/ou un partenaire",
  CONTACTE_SANS_RETOUR = "Contacté mais sans réponse",
  COORDONNEES_INCORRECT = "Coordonnées incorrectes",
  AUTRE = "Autre situation / retour",
}

export enum ACC_CONJOINT_MOTIF_ENUM {
  MOBILITE = "MOBILITE",
  LOGEMENT = "LOGEMENT",
  SANTE = "SANTE",
  FINANCE = "FINANCE",
  ADMINISTRATIF = "ADMINISTRATIF",
  REORIENTATION = "REORIENTATION",
  RECHERCHE_EMPLOI = "RECHERCHE_EMPLOI",
  AUTRE = "AUTRE",
}

export enum API_EFFECTIF_LISTE {
  PRIORITAIRE = "prioritaire",
  INJOIGNABLE = "injoignable",
  TRAITE = "traite",
  A_TRAITER = "a_traiter",
}

export const zSituationEnum = z.nativeEnum(SITUATION_ENUM);
export const zAccConjointMotifEnum = z.nativeEnum(ACC_CONJOINT_MOTIF_ENUM);
export const zApiEffectifListeEnum = z.nativeEnum(API_EFFECTIF_LISTE);

export const zEmailStatusEnum = z.enum(["valid", "invalid", "not_supported", "error", "pending"]);

export type IEmailStatusEnum = z.output<typeof zEmailStatusEnum>;

const zMissionLocaleEffectif = z.object({
  _id: zObjectId,
  mission_locale_id: zObjectId,
  effectif_id: zObjectId,
  date_rupture: z.date().nullish(),
  situation: zSituationEnum.nullish(),
  situation_autre: z.string().nullish(),
  created_at: z.date(),
  updated_at: z.date().optional(),
  deja_connu: z.boolean().nullish(),
  commentaires: z.string().optional(),
  effectif_snapshot: zEffectif.or(zEffectifDECA),
  effectif_snapshot_date: z.date().optional(),
  email_status: zEmailStatusEnum.nullish(),
  organisme_data: z
    .object({
      rupture: z.boolean({ description: "Indique si l'effectif est signalé en rupture par le CFA" }).nullish(),
      acc_conjoint: z
        .boolean({ description: "Indique si le CFA souhaite l'accompagnement conjoint pour cet effectif" })
        .nullish(),
      motif: z.array(zAccConjointMotifEnum).nullish(),
      commentaires: z.string().nullish(),
    })
    .nullish(),
  effectif_choice: z
    .object({
      confirmation: z.boolean().nullish(),
      confirmation_created_at: z.date().nullish(),
      confirmation_expired_at: z.date().nullish(),
      telephone: z.string().nullish(),
    })
    .nullish(),
  brevo: z.object({
    token: z.string().uuid().nullish(),
    token_created_at: z.date().nullish(),
    token_expired_at: z.date().nullish(),
    history: z
      .array(
        z.object({
          token: z.string().uuid(),
          token_created_at: z.date().optional(),
          token_expired_at: z.date().optional(),
        })
      )
      .nullish(),
  }),
  soft_deleted: z.boolean().nullish(),
  current_status: z.object({
    value: zStatutApprenantEnum.nullish(),
    date: z.date().nullish(),
  }),
  computed: z.object({
    organisme: z
      .object({
        ml_beta_activated_at: z.date().nullish(),
      })
      .nullish(),
  }),
});

export type IMissionLocaleEffectif = z.output<typeof zMissionLocaleEffectif>;
export type IMissionLocaleEffectifList = z.infer<typeof zApiEffectifListeEnum>;
export default { zod: zMissionLocaleEffectif, indexes, collectionName };
