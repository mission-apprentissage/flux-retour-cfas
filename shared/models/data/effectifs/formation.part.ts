import { RNCP_REGEX_PATTERN } from "../../../constants";
import { object, string, integer, arrayOf, objectId, date, boolean } from "../../json-schema/jsonSchemaTypes";
import formationsModel from "../formations.model";

const formationsProps = formationsModel.schema.properties;

export const formationEffectifSchema = object(
  {
    // TODO formation_id devrait être un objectId pointant vers la collection formations (à remplir au moment de l'import)
    formation_id: objectId({ description: "ID de la formation" }),
    // DEBUT champs collectés qui servent à retrouver le champ formation_id
    // une fois le champs formation_id rempli, ces champs ne sont plus utile
    cfd: formationsProps.cfd,
    rncp: string({
      description: "Code RNCP de la formation à laquelle l'apprenant est inscrit",
      pattern: RNCP_REGEX_PATTERN,
      maxLength: 9,
    }),
    libelle_long: string({ description: "Libellé long de la formation visée" }),
    niveau: formationsProps.niveau,
    niveau_libelle: formationsProps.niveau_libelle,
    annee: integer({ description: "Numéro de l'année dans la formation (promo)" }),
    // FIN champs collectés
    date_obtention_diplome: date({ description: "Date d'obtention du diplôme" }),
    duree_formation_relle: integer({ description: "Durée réelle de la formation en mois" }),
    periode: arrayOf(integer(), { description: "Période de la formation, en année (peut être sur plusieurs années)" }),
    // V3 - REQUIRED FIELDS (optionel pour l'instant pour supporter V2)
    date_inscription: date({ description: "Date d'inscription" }),
    // V3 - OPTIONAL FIELDS
    obtention_diplome: boolean({ description: "Diplôme obtenu" }), // vrai si date_obtention_diplome non null
    date_exclusion: date({ description: "Date d'exclusion" }),
    cause_exclusion: string({ description: "Cause de l'exclusion" }),
    referent_handicap: object({
      nom: string({ description: "Nom du référent handicap" }),
      prenom: string({ description: "Prénom du référent handicap" }),
      email: string({ description: "Email du référent handicap" }),
    }),
    formation_presentielle: boolean({ description: "Formation en présentiel" }),
    duree_theorique: integer({ description: "Durée théorique de la formation en année" }), // legacy, should be empty soon
    duree_theorique_mois: integer({ description: "Durée théorique de la formation en mois" }),
    date_fin: date({ description: "Date de fin de la formation" }),
    date_entree: date({ description: "Date d'entrée en formation" }),
  },
  {
    additionalProperties: true,
  }
);
