import {
  ACADEMIES,
  DEPARTEMENTS,
  REGIONS,
  CODE_INSEE_PATTERN,
  CODE_POSTAL_PATTERN,
  PAYS,
  CODE_POSTAL_REGEX,
  CODE_INSEE_REGEX,
  DEPARTEMENTS_BY_CODE,
  REGIONS_BY_CODE,
  ACADEMIES_BY_CODE,
  PAYS_BY_CODE,
} from "../../constants";
import { zodEnumFromObjKeys } from "../../utils/zodHelper";
import { zodOpenApi } from "../zodOpenApi";

import { object, integer, string } from "./jsonSchemaTypes";

export const zAdresse = zodOpenApi.object({
  numero: zodOpenApi
    .number({
      description: "N° de la voie",
    })
    .int()
    .openapi({ example: 13 })
    .optional(),
  repetition_voie: zodOpenApi
    .enum(["B", "T", "Q", "C"])
    .describe("Indice de répétition du numéro de voie")
    .openapi({ example: "B" })
    .optional(),
  voie: zodOpenApi
    .string({
      description: "Nom de voie",
    })
    .openapi({ example: "Boulevard de la liberté" })
    .optional(),
  complement: zodOpenApi
    .string({
      description: "Complément d'adresse",
    })
    .openapi({ example: "Bâtiment ; Résidence ; Entrée ; Appartement ; Escalier ; Etage" })
    .optional(),
  code_postal: zodOpenApi
    .string({
      description: "Le code postal doit contenir 5 caractères",
    })
    .regex(CODE_POSTAL_REGEX)
    .openapi({ example: "75000" })
    .optional(),
  code_insee: zodOpenApi
    .string({
      description: "Le code insee doit contenir 5 caractères",
    })
    .regex(CODE_INSEE_REGEX)
    .openapi({ example: "54318" })
    .optional(),
  commune: zodOpenApi
    .string({
      description: "Commune",
    })
    .openapi({ example: "PARIS" })
    .max(80)
    .optional(),
  departement: zodEnumFromObjKeys(DEPARTEMENTS_BY_CODE)
    .openapi({ examples: ["01", "59"] })
    .optional(),
  region: zodEnumFromObjKeys(REGIONS_BY_CODE).optional(),
  academie: zodEnumFromObjKeys(ACADEMIES_BY_CODE).optional(),
  complete: zodOpenApi
    .string({
      description: "Adresse complète",
    })
    .openapi({ example: "13 Boulevard de la liberté 75000 PARIS" })
    .optional(),
  pays: zodEnumFromObjKeys(PAYS_BY_CODE).describe("Pays").optional(),
  bassinEmploi: zodOpenApi
    .string({
      description: "Code Bassin d'emploi",
    })
    .optional(),
});

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

export type IAdresse = zodOpenApi.output<typeof zAdresse>;
