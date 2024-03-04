import { z } from "zod";

import { SIRET_REGEX } from "../../../constants";
import { zAdresse } from "../../parts/adresseSchema";

export const zContrat = z.object({
  siret: z.string({ description: "N° SIRET de l'employeur" }).regex(SIRET_REGEX).nullish(),
  denomination: z
    .string({
      description: "La dénomination sociale doit être celle de l'établissement dans lequel le contrat s'exécute.",
    })
    .nullish(),
  type_employeur: z
    .union(
      [
        z.literal(11),
        z.literal(12),
        z.literal(13),
        z.literal(14),
        z.literal(15),
        z.literal(16),
        z.literal(21),
        z.literal(22),
        z.literal(23),
        z.literal(24),
        z.literal(25),
        z.literal(26),
        z.literal(27),
        z.literal(28),
        z.literal(29),
      ],
      {
        description: "Le type d'employeur doit être en adéquation avec son statut juridique.",
      }
    )
    .nullish(),
  naf: z
    .string({
      description:
        "Le Code NAF est composé de 4 chiffres et 1 lettre. Il est délivré par l'INSEE.[Informations sur le Code NAF.](https://www.economie.gouv.fr/entreprises/activite-entreprise-code-ape-code-naf)",
    })
    .openapi({ example: "1031Z" })
    .regex(/^[0-9]{2}\.?[0-9]{0,2}[a-zA-Z]{0,1}$/)
    .nullish(),
  nombre_de_salaries: z
    .number({
      description:
        "L'effectif salarié rempli automatiquement correspond à l'estimation de la base Entreprises de l'INSEE. <br/>L'effectif renseigné est celui de l’entreprise dans sa globalité (et non seulement l’effectif de l’établissement d’exécution du contrat).",
    })
    .int()
    .openapi({ example: 10 })
    .nullish(),
  adresse: zAdresse.nullish(),
  date_debut: z.date({ description: "Date de début du contrat" }),
  date_fin: z.date({ description: "Date de fin du contrat" }).nullish(),
  date_rupture: z.date({ description: "Date de rupture du contrat" }).nullish(),
  cause_rupture: z.string({ description: "Cause de rupture du contrat" }).nullish(),
});
