import { SIRET_REGEX } from "../../../constants";
import { zAdresse } from "../../parts/adresseSchema";
import { zodOpenApi } from "../../zodOpenApi";

export const zContrat = zodOpenApi.object({
  siret: zodOpenApi.string({ description: "N° SIRET de l'employeur" }).regex(SIRET_REGEX).nullish(),
  denomination: zodOpenApi
    .string({
      description: "La dénomination sociale doit être celle de l'établissement dans lequel le contrat s'exécute.",
    })
    .nullish(),
  type_employeur: zodOpenApi
    .union(
      [
        zodOpenApi.literal(11),
        zodOpenApi.literal(12),
        zodOpenApi.literal(13),
        zodOpenApi.literal(14),
        zodOpenApi.literal(15),
        zodOpenApi.literal(16),
        zodOpenApi.literal(21),
        zodOpenApi.literal(22),
        zodOpenApi.literal(23),
        zodOpenApi.literal(24),
        zodOpenApi.literal(25),
        zodOpenApi.literal(26),
        zodOpenApi.literal(27),
        zodOpenApi.literal(28),
        zodOpenApi.literal(29),
        zodOpenApi.literal(30),
      ],
      {
        description: "Le type d'employeur doit être en adéquation avec son statut juridique.",
      }
    )
    .nullish(),
  naf: zodOpenApi
    .string({
      description:
        "Le Code NAF est composé de 4 chiffres et 1 lettre. Il est délivré par l'INSEE.[Informations sur le Code NAF.](https://www.economie.gouv.fr/entreprises/activite-entreprise-code-ape-code-naf)",
    })
    .openapi({ example: "1031Z" })
    .regex(/^[0-9]{2}\.?[0-9]{0,2}[a-zA-Z]{0,1}$/)
    .nullish(),
  nombre_de_salaries: zodOpenApi
    .number({
      description:
        "L'effectif salarié rempli automatiquement correspond à l'estimation de la base Entreprises de l'INSEE. <br/>L'effectif renseigné est celui de l’entreprise dans sa globalité (et non seulement l’effectif de l’établissement d’exécution du contrat).",
    })
    .int()
    .openapi({ example: 10 })
    .nullish(),
  adresse: zAdresse.nullish(),
  date_debut: zodOpenApi.date({ description: "Date de début du contrat" }),
  date_fin: zodOpenApi.date({ description: "Date de fin du contrat" }).nullish(),
  date_rupture: zodOpenApi.date({ description: "Date de rupture du contrat" }).nullish(),
  cause_rupture: zodOpenApi.string({ description: "Cause de rupture du contrat" }).nullish(),
});

export type IContrat = zodOpenApi.infer<typeof zContrat>;
