import { object, string, integer } from "./jsonSchemaTypes.js";

export const adresseSchema = object({
  numero: integer({
    description: "N° de la voie",
    example: 13,
    pattern: "^(?!0{1})[0-9]*$",
    // Nullable
  }),
  repetition_voie: string({
    description: "Indice de répétition du numéro de voie",
    example: "B",
    enum: [null, "B", "T", "Q", "C"],
    // Nullable
  }),
  voie: string({
    description: "Nom de voie",
    example: "Boulevard de la liberté",
    // Nullable
  }),
  complement: string({
    description: "Complément d'adresse",
    example: "Bâtiment ; Résidence ; Entrée ; Appartement ; Escalier ; Etage",
    // Nullable
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
  // departement: object(
  //   {
  //     code: string(),
  //     nom: string(),
  //   },
  //   { required: ["code", "nom"] }
  // ),
  // region: object(
  //   {
  //     code: string(),
  //     nom: string(),
  //   },
  //   { required: ["code", "nom"] }
  // ),
  // academie: object(
  //   {
  //     code: string(),
  //     nom: string(),
  //   },
  //   { required: ["code", "nom"] }
  // ),
});

// Default value
export function defaultValuesAdresse() {
  return {
    numero: null,
    repetition_voie: null,
    voie: null,
    complement: null,
    code_postal: null,
    code_insee: null,
    commune: null,
  };
}
