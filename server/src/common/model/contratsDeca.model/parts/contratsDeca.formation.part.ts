import { object, string, stringOrNull } from "../../json-schema/jsonSchemaTypes";

export const contratsDecaFormationSchema = object(
  {
    dateDebutFormation: string({ description: "La date de début de la formation" }),
    dateFinFormation: string({ description: "La date de fin de la formation" }),
    codeDiplome: string({ description: "Le code diplôme de la formation" }),
    rncp: stringOrNull({ description: "Le code RNCP de la formation" }),
    intituleOuQualification: stringOrNull({ description: "L'adresse email de l'alternant" }),
  },
  {
    required: ["dateDebutFormation", "dateFinFormation", "codeDiplome"],
  }
);
