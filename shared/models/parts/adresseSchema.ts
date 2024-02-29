import {
  CODE_POSTAL_REGEX,
  CODE_INSEE_REGEX,
  DEPARTEMENTS_BY_CODE,
  REGIONS_BY_CODE,
  ACADEMIES_BY_CODE,
  PAYS_BY_CODE,
} from "../../constants";
import { zodEnumFromObjKeys } from "../../utils/zodHelper";
import { zodOpenApi } from "../zodOpenApi";

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

export type IAdresse = zodOpenApi.output<typeof zAdresse>;
