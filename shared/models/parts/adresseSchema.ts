import { CODE_POSTAL_REGEX, CODE_INSEE_REGEX, PAYS_BY_CODE } from "../../constants";
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
    .openapi({ example: "75001" })
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
  departement: zodOpenApi
    .string()
    .regex(/^[0-9]{2,3}$/)
    .openapi({ examples: ["01", "59"] })
    .optional(),
  region: zodOpenApi
    .string()
    .regex(/^[0-9]{2,3}$/)
    .optional(),
  academie: zodOpenApi
    .string()
    .regex(/^[0-9]{2}$/)
    .optional(),
  complete: zodOpenApi
    .string({
      description: "Adresse complète",
    })
    .openapi({ example: "13 Boulevard de la liberté 75001 PARIS" })
    .optional(),
  pays: zodEnumFromObjKeys(PAYS_BY_CODE).describe("Pays").optional(),
  bassinEmploi: zodOpenApi
    .string({
      description: "Code Bassin d'emploi",
    })
    .optional(),
});
