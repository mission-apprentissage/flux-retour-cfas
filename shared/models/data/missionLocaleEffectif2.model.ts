import type { CreateIndexesOptions, IndexSpecification } from "mongodb";
import { z } from "zod";
import { zObjectId } from "zod-mongodb-schema";

import { zEffectif, zStatutApprenantEnum } from "./effectifs.model";
import { zEffectifDECA } from "./effectifsDECA.model";
import { zEffectifV2 } from "./v2/effectif.v2.model";
import { zPersonV2 } from "./v2/person.v2.model";
import { zFormationV2 } from "./v2";

const collectionName = "missionLocaleEffectif2";

const indexes: [IndexSpecification, CreateIndexesOptions][] = [
  [{ mission_locale_id: 1, effectif_id: 1 }, { unique: true }],
];

export enum SITUATION_ENUM {
  RDV_PRIS = "RDV_PRIS",
  NOUVEAU_PROJET = "NOUVEAU_PROJET",
  DEJA_ACCOMPAGNE = "DEJA_ACCOMPAGNE",
  CONTACTE_SANS_RETOUR = "CONTACTE_SANS_RETOUR",
  COORDONNEES_INCORRECT = "COORDONNEES_INCORRECT",
  INJOIGNABLE_APRES_RELANCES = "INJOIGNABLE_APRES_RELANCES",
  NOUVEAU_CONTRAT = "NOUVEAU_CONTRAT",
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
  INJOIGNABLE_APRES_RELANCES = "Injoignable après plusieurs tentatives",
  NOUVEAU_CONTRAT = "Ce jeune a retrouvé un contrat d'apprentissage",
  AUTRE = "Autre situation / retour",
}

export enum PROBLEME_TYPE_ENUM {
  COORDONNEES_INCORRECTES = "coordonnees_incorrectes",
  JEUNE_INJOIGNABLE = "jeune_injoignable",
  AUTRE = "autre",
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
  INJOIGNABLE_PRIORITAIRE = "injoignable_prioritaire",
  A_TRAITER_PRIORITAIRE = "a_traiter_prioritaire",
  TRAITE_PRIORITAIRE = "traite_prioritaire",
}

export const zSituationEnum = z.nativeEnum(SITUATION_ENUM);
export const zProblemeTypeEnum = z.nativeEnum(PROBLEME_TYPE_ENUM);
export const zAccConjointMotifEnum = z.nativeEnum(ACC_CONJOINT_MOTIF_ENUM);
export const zApiEffectifListeEnum = z.nativeEnum(API_EFFECTIF_LISTE);

export const zEmailStatusEnum = z.enum(["valid", "invalid", "not_supported", "error", "pending"]);

export type IEmailStatusEnum = z.output<typeof zEmailStatusEnum>;

const zMissionLocaleEffectif2 = z.object({
  _id: zObjectId,
  mission_locale_id: zObjectId,
  effectifV2_id: zObjectId,
  date_rupture: z.date().nullish(),
  created_at: z.date(),
  updated_at: z.date().optional(),
  effectif_snapshot: zEffectif.or(zEffectifDECA).nullish(),
  effectif_snapshot_date: z.date().optional(),
  email_status: zEmailStatusEnum.nullish(),
  mle_ids: z.array(zObjectId).nullish(),
  mission_locale_data: z.object({
    situation: zSituationEnum.nullish(),
    situation_autre: z.string().nullish(),
    deja_connu: z.boolean().nullish(),
    commentaires: z.string().optional(),
    probleme_type: zProblemeTypeEnum.nullish(),
    probleme_detail: z.string().nullish(),
  })
    .nullish(),
  organisme_data: z
    .object({
      rupture: z.boolean({ description: "Indique si l'effectif est signalé en rupture par le CFA" }).nullish(),
      acc_conjoint: z
        .boolean({ description: "Indique si le CFA souhaite l'accompagnement conjoint pour cet effectif" })
        .nullish(),
      motif: z.array(zAccConjointMotifEnum).nullish(),
      commentaires: z.string().nullish(),
      reponse_at: z.date({ description: "Date de réponse au formulaire par le CFA" }).nullish(),
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
  }).nullish(),
  soft_deleted: z.boolean().nullish(),
  current_status: z.object({
    value: zStatutApprenantEnum.nullish(),
    date: z.date().nullish(),
  }).nullish(),
  computed: z
    .object({
      organisme: z
        .object({
          ml_beta_activated_at: z.date().nullish(),
        })
        .nullish(),
      mission_locale: z
        .object({
          activated_at: z.date().nullish(),
        })
        .nullish(),
      effectif: zEffectifV2.nullish(),
      person: zPersonV2.nullish(),
      formation: zFormationV2.nullish(),
    })
    .nullish(),
});

export type IMissionLocale2Effectif = z.output<typeof zMissionLocaleEffectif2>;
export type IMissionLocale2EffectifList = z.infer<typeof zApiEffectifListeEnum>;
export default { zod: zMissionLocaleEffectif2, indexes, collectionName };
