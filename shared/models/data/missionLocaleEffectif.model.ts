import type { CreateIndexesOptions, IndexSpecification } from "mongodb";
import { z } from "zod";
import { zObjectId } from "zod-mongodb-schema";

const collectionName = "missionLocaleEffectif";

const indexes: [IndexSpecification, CreateIndexesOptions][] = [
  [{ mission_locale_id: 1, effectif_id: 1 }, { unique: true }],
];

export enum SITUATION_ENUM {
  A_CONTACTER = "A_CONTACTER",
  CONTACTE = "CONTACTE",
  SUIVI_DEMARRE = "SUIVI_DEMARRE",
  CONTACT_SANS_SUIVI = "CONTACT_SANS_SUIVI",
  INJOIGNABLE = "INJOIGNABLE",
  DEJA_SUIVI = "DEJA_SUIVI",
}

export enum API_SITUATION_ENUM {
  NON_TRAITE = "NON_TRAITE",
}

export enum OLD_SITUATION_ENUM {
  CONTACTE_AVEC_SUIVI = "CONTACTE_AVEC_SUIVI", //old
  NON_CONTACTE = "NON_CONTACTE", //old
}

export enum SITUATION_LABEL_ENUM {
  A_CONTACTER = "A contacter",
  CONTACTE = "Contacté",
  SUIVI_DEMARRE = "Suivi démarré",
  INJOIGNABLE = "Injoignable",
  CONTACT_SANS_SUIVI = "Contacté, pas de suivi nécessaire",
  DEJA_SUIVI = "Déjà accompagné par ML",
}

export enum STATUT_JEUNE_MISSION_LOCALE {
  CONTRAT_SIGNE_NON_DEMARRE = "CONTRAT_SIGNE_NON_DEMARRE",
  CONTRAT_EN_COURS = "CONTRAT_EN_COURS",
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

export const zSituationEnum = z.nativeEnum({ ...SITUATION_ENUM, ...OLD_SITUATION_ENUM });
export const zApiSituationEnum = z
  .nativeEnum({ ...SITUATION_ENUM, ...API_SITUATION_ENUM })
  .transform((arg) => (arg === API_SITUATION_ENUM.NON_TRAITE ? null : arg));

const zMissionLocaleEffectif = z.object({
  _id: zObjectId,
  mission_locale_id: zObjectId,
  effectif_id: zObjectId,
  situation: zSituationEnum.nullish(),
  situation_updated_at: z.date().optional(),
  statut_correct: z.boolean().optional(),
  statut_reel: z.nativeEnum(STATUT_JEUNE_MISSION_LOCALE).nullish(),
  statut_reel_text: z.string().max(150).optional(),
  inscrit_france_travail: z.nativeEnum(INSCRIPTION_FRANCE_TRAVAIL).optional(),
  commentaires: z.string().max(200).optional(),
});

export type IMissionLocaleEffectif = z.output<typeof zMissionLocaleEffectif>;
export default { zod: zMissionLocaleEffectif, indexes, collectionName };
