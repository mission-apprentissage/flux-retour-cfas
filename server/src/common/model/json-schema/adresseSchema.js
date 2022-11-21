import { object, string, integer } from "./jsonSchemaTypes.js";

export const adresseSchema = object({
  numero: integer({
    description: "N° de la voie",
    example: 13,
    pattern: "^(?!0{1})[0-9]*$",
  }),
  repetition_voie: string({
    description: "Indice de répétition du numéro de voie",
    example: "B",
    enum: [null, "B", "T", "Q", "C"],
  }),
  voie: string({
    description: "Nom de voie",
    example: "Boulevard de la liberté",
  }),
  complement: string({
    description: "Complément d'adresse",
    example: "Bâtiment ; Résidence ; Entrée ; Appartement ; Escalier ; Etage",
  }),
  code_postal: string({
    description: "Le code postal doit contenir 5 caractères",
    example: "75000",
    pattern: "^[0-9]{5}$",
    maxLength: 5,
    minLength: 5,
  }),
  code_insee: string({
    description: "Le code insee doit contenir 5 caractères",
    example: "54318",
    pattern: "^[0-9]{5}$",
    maxLength: 5,
    minLength: 5,
  }),
  commune: string({
    description: "Commune",
    example: "PARIS",
    maxLength: 80,
  }),
  departement: object(
    {
      code: string(),
      nom: string(),
    },
    { required: ["code", "nom"] }
  ),
  region: object(
    {
      code: string(),
      nom: string(),
    },
    { required: ["code", "nom"] }
  ),
  academie: object(
    {
      code: string(),
      nom: string(),
    },
    { required: ["code", "nom"] }
  ),
  complete: string({
    description: "Adresse complète",
    example: "13 Bis Boulevard de la liberté 75000 PARIS",
  }),
});

// Default value
export function defaultValuesAdresse() {
  return {
    // voie: null,
    // code_postal: null,
    // code_insee: null,
    // commune: null,
  };
}
