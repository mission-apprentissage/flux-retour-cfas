import { z } from "zod";
import { zObjectId } from "zod-mongodb-schema";

export const zOrganismeReferentiel = z.object({
  _id: zObjectId,
  siret: z.string(),
  uai: z.string().optional(),
  raison_sociale: z.string().optional(),
  enseigne: z.string().nullish(),
  etat_administratif: z.enum(["actif", "fermé"]).optional(),
  adresse: z
    .object({
      label: z.string().optional(),
      code_postal: z.string(),
      code_insee: z.string(),
      localite: z.string(),
      departement: z
        .object({
          code: z.string(),
          nom: z.string(),
        })
        .optional(),
      region: z.object({
        code: z.string(),
        nom: z.string(),
      }),
      academie: z.object({
        code: z.string(),
        nom: z.string(),
      }),
      geojson: z
        .object({
          type: z.string(),
          geometry: z.object({
            type: z.string(),
            coordinates: z.array(z.any()),
          }),
          properties: z
            .object({
              score: z.number().optional(),
              source: z.string().optional(),
            })
            .optional(),
        })
        .optional(),
    })
    .optional(),
});

export type IOrganismeReferentiel = z.output<typeof zOrganismeReferentiel>;
