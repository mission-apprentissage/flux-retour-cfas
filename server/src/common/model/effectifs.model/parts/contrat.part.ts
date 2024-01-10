import { SIRET_REGEX_PATTERN, object, string, date, integer } from "shared";

import { adresseSchema } from "@/common/model/json-schema/adresseSchema";

export const contratSchema = object(
  {
    siret: string({
      description: "N° SIRET de l'employeur",
      pattern: SIRET_REGEX_PATTERN,
      maxLength: 14,
      minLength: 14,
    }),
    denomination: string({
      description: "La dénomination sociale doit être celle de l'établissement dans lequel le contrat s'exécute.",
    }),
    type_employeur: integer({
      enum: [11, 12, 13, 14, 15, 16, 21, 22, 23, 24, 25, 26, 27, 28, 29],
      description: "Le type d'employeur doit être en adéquation avec son statut juridique.",
    }),
    naf: string({
      maxLength: 6,
      description:
        "Le Code NAF est composé de 4 chiffres et 1 lettre. Il est délivré par l'INSEE.[Informations sur le Code NAF.](https://www.economie.gouv.fr/entreprises/activite-entreprise-code-ape-code-naf)",
      example: "1031Z",
      pattern: "^([0-9]){2}\\.?([0-9]){0,2}([a-zA-Z]){0,1}$",
    }),
    nombre_de_salaries: integer({
      description:
        "L'effectif salarié rempli automatiquement correspond à l'estimation de la base Entreprises de l'INSEE. <br/>L'effectif renseigné est celui de l’entreprise dans sa globalité (et non seulement l’effectif de l’établissement d’exécution du contrat).",
      example: 123,
    }),
    adresse: {
      ...adresseSchema,
    },
    date_debut: date({ description: "Date de début du contrat" }),
    date_fin: date({ description: "Date de fin du contrat" }),
    date_rupture: date({ description: "Date de rupture du contrat" }),
    cause_rupture: string({ description: "Cause de rupture du contrat" }),
  },
  {
    required: ["date_debut"], // TODO siret // Removed required date_rupture car on contrat peut ne pas avoir de rupture
    additionalProperties: true,
  }
);
