import type { CreateIndexesOptions, IndexSpecification } from "mongodb";
import { z } from "zod";
import { zObjectId } from "zod-mongodb-schema";

const collectionName = "missionLocaleEffectif";

const indexes: [IndexSpecification, CreateIndexesOptions][] = [];

export enum SITUATION_ENUM {
  CONTACTE_AVEC_SUIVI = "CONTACTE_AVEC_SUIVI",
  CONTACT_SANS_SUIVI = "CONTACT_SANS_SUIVI",
  DEJA_SUIVI = "DEJA_SUIVI",
  INJOIGNABLE = "INJOIGNABLE",
  NON_CONTACTE = "NON_CONTACTE",
}

export enum SITUATION_LABEL_ENUM {
  CONTACTE_AVEC_SUIVI = "Contacté, soutien nécessaire",
  CONTACT_SANS_SUIVI = "Contacté, pas de suivi nécessaire",
  DEJA_SUIVI = "Déjà accompagné par ML",
  INJOIGNABLE = "Injoignable",
  NON_CONTACTE = "Non contacté",
}

export enum STATUT_JEUNE_MISSION_LOCALE {
  CONTRAT_SIGNE_NON_DEMARRE = "CONTRAT_SIGNE_NON_DEMARRE",
  RETOUR_EN_VOIE_SCOLAIRE = "RETOUR_EN_VOIE_SCOLAIRE",
  ABANDON = "ABANDON",
  RUPTURE = "RUPTURE",
  DECROCHAGE = "DECROCHAGE",
  AUTRE = "AUTRE",
}
export enum INSCRIPTION_FRANCE_TRAVAIL {
  OUI = "OUI",
  NON = "NON",
  INCONNU = "INCONNU",
}

export const zSituationEnum = z.nativeEnum(SITUATION_ENUM);

const zMissionLocaleEffectif = z.object({
  _id: zObjectId,
  mission_locale_id: zObjectId,
  effectif_id: zObjectId,
  situation: zSituationEnum.optional(),
  situation_updated_at: z.date(),
  statut_correct: z.boolean().optional(),
  statut_reel: z.nativeEnum(STATUT_JEUNE_MISSION_LOCALE).optional(),
  statut_reel_text: z.string().max(150).optional(),
  inscrit_france_travail: z.nativeEnum(INSCRIPTION_FRANCE_TRAVAIL).optional(),
  commentaires: z.string().max(500).optional(),
});

export type IMissionLocaleEffectif = z.output<typeof zMissionLocaleEffectif>;
export default { zod: zMissionLocaleEffectif, indexes, collectionName };
