import { z } from "zod";
import { zObjectId } from "zod-mongodb-schema";

import { RNCP_REGEX } from "../../../constants";
import formationsModel from "../formations.model";

const formationsProps = formationsModel.zod.shape;

export const zFormationEffectif = z.object({
  // TODO formation_id devrait être un objectId pointant vers la collection formations (à remplir au moment de l'import)
  formation_id: zObjectId.describe("ID de la formation").nullish(),
  // DEBUT champs collectés qui servent à retrouver le champ formation_id
  // une fois le champs formation_id rempli, ces champs ne sont plus utile
  cfd: formationsProps.cfd.nullish(),
  rncp: z
    .string({
      description: "Code RNCP de la formation à laquelle l'apprenant est inscrit",
    })
    .regex(RNCP_REGEX)
    .nullish(),
  libelle_long: z.string({ description: "Libellé long de la formation visée" }).nullish(),
  libelle_court: z.string({ description: "Libellé court de la formation visée" }).nullish(),
  niveau: formationsProps.niveau.nullish(),
  niveau_libelle: formationsProps.niveau_libelle.nullish(),
  annee: z.number({ description: "Numéro de l'année dans la formation (promo)" }).int().nullish(),
  // FIN champs collectés
  date_obtention_diplome: z.coerce.date({ description: "Date d'obtention du diplôme" }).nullish(),
  duree_formation_relle: z.number({ description: "Durée réelle de la formation en mois" }).int().nullish(),
  periode: z
    .array(z.number().int(), {
      description: "Période de la formation, en année (peut être sur plusieurs années)",
    })
    .nullish(),
  // V3 - REQUIRED FIELDS (optionel pour l'instant pour supporter V2)
  date_inscription: z.coerce.date({ description: "Date d'inscription" }).nullish(),
  // V3 - OPTIONAL FIELDS
  obtention_diplome: z.boolean({ description: "Diplôme obtenu" }).nullish(), // vrai si date_obtention_diplome non null
  date_exclusion: z.coerce.date({ description: "Date d'exclusion" }).nullish(),
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
  date_fin: z.coerce.date({ description: "Date de fin de la formation" }).nullish(),
  date_entree: z.coerce.date({ description: "Date d'entrée en formation" }).nullish(),
});

export type IFormationEffectif = z.output<typeof zFormationEffectif>;
