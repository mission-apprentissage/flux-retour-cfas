import { z } from "zod";

import { CFD_REGEX, RNCP_REGEX } from "../../../constants";

export const zFormationEffectif = z.object({
  cfd: z.string({ description: "Code CFD de la formation" }).regex(CFD_REGEX).nullish(),
  rncp: z
    .string({
      description: "Code RNCP de la formation à laquelle l'apprenant est inscrit",
    })
    .regex(RNCP_REGEX)
    .nullish(),
  libelle_long: z.string({ description: "Libellé long de la formation visée" }).nullish(),
  libelle_court: z.string({ description: "Libellé court de la formation visée" }).nullish(),
  niveau: z.string({ description: "Niveau de formation récupéré via Tables de Correspondances" }).nullish(),
  niveau_libelle: z
    .string({
      description: "Libellé du niveau de formation récupéré via Tables de Correspondances",
    })
    .nullish(),
  annee: z.number({ description: "Numéro de l'année dans la formation (promo)" }).int().nullish(),
  // FIN champs collectés
  date_obtention_diplome: z.date({ description: "Date d'obtention du diplôme" }).nullish(),
  duree_formation_relle: z.number({ description: "Durée réelle de la formation en mois" }).int().nullish(),
  periode: z
    .array(z.number().int(), {
      description: "Période de la formation, en année (peut être sur plusieurs années)",
    })
    .nullish(),
  // V3 - REQUIRED FIELDS (optionel pour l'instant pour supporter V2)
  date_inscription: z.date({ description: "Date d'inscription" }).nullish(),
  // V3 - OPTIONAL FIELDS
  obtention_diplome: z.boolean({ description: "Diplôme obtenu" }).nullish(), // vrai si date_obtention_diplome non null
  date_exclusion: z.date({ description: "Date d'exclusion" }).nullish(),
  cause_exclusion: z.string({ description: "Cause de l'exclusion" }).nullish(),
  referent_handicap: z
    .object({
      nom: z.string({ description: "Nom du référent handicap" }).nullish(),
      prenom: z.string({ description: "Prénom du référent handicap" }).nullish(),
      email: z.string({ description: "Email du référent handicap" }).nullish(),
    })
    .nullish(),
  formation_presentielle: z.boolean({ description: "Formation en présentiel" }).nullish(),
  duree_theorique: z.number({ description: "Durée théorique de la formation en année" }).int().nullish(), // legacy, should be empty soon
  duree_theorique_mois: z.number({ description: "Durée théorique de la formation en mois" }).int().nullish(),
  date_fin: z.date({ description: "Date de fin de la formation" }).nullish(),
  date_entree: z.date({ description: "Date d'entrée en formation" }).nullish(),
});

export type IFormationEffectif = z.output<typeof zFormationEffectif>;
