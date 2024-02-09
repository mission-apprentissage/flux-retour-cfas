import { ACADEMIES, DEPARTEMENTS, REGIONS, CODE_INSEE_PATTERN, CODE_POSTAL_PATTERN, PAYS } from "../../constants";

import { object, integer, string } from "./jsonSchemaTypes";

export const adresseSchema = object({
  numero: integer({
    description: "N° de la voie",
    example: 13,
    pattern: "^(?!0{1})[0-9]*$",
  }),
  repetition_voie: string({
    description: "Indice de répétition du numéro de voie",
    example: "B",
    enum: ["B", "T", "Q", "C"],
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
    pattern: CODE_POSTAL_PATTERN,
    maxLength: 5,
    minLength: 5,
  }),
  code_insee: string({
    description: "Le code insee doit contenir 5 caractères",
    example: "54318",
    pattern: CODE_INSEE_PATTERN,
    maxLength: 5,
    minLength: 5,
  }),
  commune: string({
    description: "Commune",
    example: "PARIS",
    maxLength: 80,
  }),
  departement: string({
    example: "1 Ain, 99 Étranger",
    pattern: "^([0-9][0-9]|2[AB]|9[012345]|97[12345678]|98[46789])$",
    enum: DEPARTEMENTS.map(({ code }) => code),
    maxLength: 3,
    minLength: 1,
  }),
  region: string({
    enum: REGIONS.map(({ code }) => code),
  }),
  academie: string({
    enum: ACADEMIES.map(({ code }) => code),
  }),
  complete: string({
    description: "Adresse complète",
    example: "13 Bis Boulevard de la liberté 75000 PARIS",
  }),
  pays: string({
    enum: PAYS.map(({ code }) => code),
    description: "Pays",
  }),
  bassinEmploi: string({
    description: "Code Bassin d'emploi",
  }),
});

// Default value
export function defaultValuesAdresse() {
  return {};
}
