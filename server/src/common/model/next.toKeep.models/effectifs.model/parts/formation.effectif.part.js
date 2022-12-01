import { object, string, integer, arrayOf, objectId, date } from "../../../json-schema/jsonSchemaTypes.js";

export const formationEffectifSchema = object(
  {
    formation_id: objectId({
      description: "formation id",
    }),
    date_debut_formation: date({ description: "Date de début de la formation" }),
    date_fin_formation: date({ description: "Date de fin de la formation" }),
    date_obtention_diplome: date({ description: "Date d'obtention du diplome" }),
    duree_formation_relle: integer({
      description: "Durée réelle de la formation en mois",
    }),
    cfd: string({
      description: "CFD de la formation à laquelle l'apprenant est inscrit",
      pattern: "^[0-9A-Z]{8}[A-Z]?$",
      maxLength: 8,
    }),
    rncp: string({
      description: "Code RNCP de la formation à laquelle l'apprenant est inscrit",
      pattern: "^(RNCP)?[0-9]{2,5}$",
      maxLength: 9,
    }),
    libelle_long: string({ description: "Libellé court de la formation visée" }),
    niveau: string({ description: "Le niveau de la formation (ex: 3)" }),
    niveau_libelle: string({
      description: "Libellé du niveau de la formation (ex: '3 (BTS, DUT...)')",
    }),
    periode: arrayOf(integer(), { description: "Date debut & date de fin de la formation" }),
    annee: integer({ description: "Numéro de l'année dans la formation (promo)" }),
  },
  {
    required: ["cfd"], // TODO formation_id
    additionalProperties: true,
  }
);

// Default value
export function defaultValuesFormationEffectif() {
  return {
    periode: [],
  };
}
