import { z } from "zod";
import { zObjectId } from "zod-mongodb-schema";

import { SourceApprenantEnum } from "shared/constants/effectifs";
import zMissionLocaleEffectif, { zSituationEnum } from "shared/models/data/missionLocaleEffectif.model";

import { zEffectifComputedOrganisme, zStatutApprenantEnum } from "../../data";
import { zApprenant } from "../../data/effectifs/apprenant.part";
import { zContrat } from "../../data/effectifs/contrat.part";
import { zFormationEffectif } from "../../data/effectifs/formation.part";

const zApprenantPick = zApprenant.pick({
  nom: true,
  prenom: true,
  date_de_naissance: true,
  adresse: true,
  telephone: true,
  courriel: true,
  rqth: true,
  responsable_mail1: true,
});

export const updateMissionLocaleEffectifApi = {
  situation: zSituationEnum.optional(),
  situation_autre: zMissionLocaleEffectif.zod.shape.situation_autre.optional(),
  commentaires: zMissionLocaleEffectif.zod.shape.commentaires.optional(),
  deja_connu: z.boolean().nullish(),
};

const zEffectifMissionLocale = z
  .object({
    id: zObjectId,
    formation: zFormationEffectif,
    contrats: z.array(zContrat).nullish(),
    organisme: zEffectifComputedOrganisme,
    source: SourceApprenantEnum,
    a_traiter: z.boolean(),
    transmitted_at: z.date().nullish(),
    prioritaire: z.boolean().nullish(),
    injoignable: z.boolean().nullish(),
    autorisation_contact: z.boolean().nullish(),
    dernier_statut: z
      .object({
        date: z.date(),
        valeur: zStatutApprenantEnum,
      })
      .nullish(),
    situation: z.object(updateMissionLocaleEffectifApi).nullish(),
    current_status: zMissionLocaleEffectif.zod.shape.current_status.nullish(),
    a_contacter: z.boolean().nullish(),
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
