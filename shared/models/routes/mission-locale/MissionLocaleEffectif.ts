import { z } from "zod";
import { zObjectId } from "zod-mongodb-schema";

import { SourceApprenantEnum } from "shared/constants/effectifs";
import zMissionLocaleEffectif, {
  zSituationEnum,
  zProblemeTypeEnum,
} from "shared/models/data/missionLocaleEffectif.model";

import { zEffectifComputedOrganisme, zStatutApprenantEnum } from "../../data";
import { zApprenant } from "../../data/effectifs/apprenant.part";
import { zContrat } from "../../data/effectifs/contrat.part";
import { zFormationEffectif } from "../../data/effectifs/formation.part";
import {
  zMissionLocaleEffectifMLLog,
  zMissionLocaleEffectifOrganismeLog,
} from "../../data/missionLocaleEffectifLog.model";

export const zMissionLocaleEffectifLogWithUnread = z.discriminatedUnion("type", [
  zMissionLocaleEffectifMLLog.extend({
    unread_by_current_user: z.boolean().describe("Indique si ce log est non lu par l'utilisateur connecté").nullish(),
  }),
  zMissionLocaleEffectifOrganismeLog.extend({
    unread_by_current_user: z.boolean().describe("Indique si ce log est non lu par l'utilisateur connecté").nullish(),
  }),
]);
const zApprenantPick = zApprenant
  .pick({
    nom: true,
    prenom: true,
    date_de_naissance: true,
    adresse: true,
    telephone: true,
    courriel: true,
    rqth: true,
    responsable_mail1: true,
  })
  .extend({
    telephone_corrected: z.string().nullish(),
  });

export const updateMissionLocaleEffectifApi = {
  situation: zSituationEnum.optional(),
  situation_autre: zMissionLocaleEffectif.zod.shape.situation_autre.optional(),
  commentaires: zMissionLocaleEffectif.zod.shape.commentaires.optional(),
  deja_connu: z.boolean().nullish(),
  probleme_type: zProblemeTypeEnum.optional(),
  probleme_detail: z.string().optional(),
};

const zEffectifMissionLocale = z
  .object({
    id: zObjectId,
    formation: zFormationEffectif,
    contrats: z.array(zContrat).nullish(),
    organisme: zEffectifComputedOrganisme.extend({
      nom: z.string().nullish(),
      raison_sociale: z.string().nullish(),
      adresse: z
        .object({
          departement: z.string().nullish(),
          code_postal: z.string().nullish(),
          commune: z.string().nullish(),
        })
        .nullish(),
    }),
    source: SourceApprenantEnum,
    a_traiter: z.boolean(),
    transmitted_at: z.date().nullish(),
    prioritaire: z.boolean().nullish(),
    injoignable: z.boolean().nullish(),
    nouveau_contrat: z.boolean().describe("Indique si le jeune a retrouvé un contrat après rupture/abandon").nullish(),
    autorisation_contact: z.boolean().nullish(),
    date_rupture: z
      .object({
        date: z.date(),
        valeur: zStatutApprenantEnum,
      })
      .nullish(),
    situation: z.object(updateMissionLocaleEffectifApi).nullish(),
    current_status: zMissionLocaleEffectif.zod.shape.current_status.nullish(),
    a_contacter: z.boolean().nullish(),
    mineur: z.boolean().nullish(),
    presque_6_mois: z.boolean().nullish(),
    acc_conjoint: z.boolean().nullish(),
    rqth: z.boolean().nullish(),
    mission_locale_logs: z.array(zMissionLocaleEffectifLogWithUnread).nullish(),
    unread_by_current_user: z
      .boolean()
      .describe("Indique si l'utilisateur connecté a une notification non lue pour cet effectif")
      .nullish(),
    contact_cfa: z
      .object({
        nom: z.string(),
        prenom: z.string(),
        email: z.string(),
        telephone: z.string().nullish(),
      })
      .describe("Coordonnées de l'accompagnant CFA (uniquement si CFA actif avec ml_beta_activated_at)")
      .nullish(),
    mission_locale_organisation: z
      .object({
        _id: zObjectId,
        nom: z.string(),
        email: z.string().nullish(),
        telephone: z.string().nullish(),
        activated_at: z.date().nullish(),
      })
      .nullish(),
  })
  .merge(zApprenantPick);

const zPrevIousNext = z.object({ id: z.string(), nom: z.string(), prenom: z.string() });

const zResponseEffectifMissionLocale = z.object({
  effectif: zEffectifMissionLocale,
  previous: zPrevIousNext.nullish(),
  next: zPrevIousNext.nullish(),
  currentIndex: z.number(),
  total: z.number(),
});

export type IEffecifMissionLocale = z.infer<typeof zResponseEffectifMissionLocale>;
export type IUpdateMissionLocaleEffectif = z.output<z.ZodObject<typeof updateMissionLocaleEffectifApi>>;
