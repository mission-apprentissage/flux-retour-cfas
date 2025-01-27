import type { CreateIndexesOptions, IndexSpecification } from "mongodb";
import { z } from "zod";
import { zObjectId } from "zod-mongodb-schema";

const collectionName = "organismesReferentiel";

const indexes: [IndexSpecification, CreateIndexesOptions][] = [
  [{ siret: 1 }, { unique: true }],
  [{ uai: 1 }, {}],
  [{ "uai_potentiels.uai": 1 }, {}],
  [{ numero_declaration_activite: 1 }, {}],
  [{ nature: 1 }, {}],
  [{ referentiels: 1 }, {}],
  [{ "adresse.departement.code": 1 }, {}],
  [{ "adresse.region.code": 1 }, {}],
  [{ "adresse.academie.code": 1 }, {}],
  [{ "relations.type": 1 }, {}],
  [{ etat_administratif: 1 }, {}],
  [{ qualiopi: 1 }, {}],
  [{ "adresse.geojson.geometry": "2dsphere" }, {}],
  [
    { siret: "text", uai: "text", raison_sociale: "text" },
    { name: "fulltext", default_language: "french" },
  ],
];

export const zContactReferentiel = z
  .object({
    email: z.string().optional(),
    confirmé: z.boolean().optional(),
    date_collecte: z.string().optional(),
    sources: z.array(z.string()).optional(),
  })
  .nonstrict();

const zOrganismeReferentiel = z.object({
  _id: zObjectId,
  siret: z.string(),
  uai: z.string().optional(),
  raison_sociale: z.string().optional(),
  enseigne: z.string().nullish(),
  siege_social: z.boolean().optional(),
  numero_declaration_activite: z.string().optional(),
  etat_administratif: z.enum(["actif", "fermé"]).optional(),
  nature: z.enum(["responsable", "formateur", "responsable_formateur", "inconnue"]),
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
  forme_juridique: z
    .object({
      code: z.string(),
      label: z.string(),
    })
    .optional(),
  qualiopi: z.boolean().optional(),
  lieux_de_formation: z.array(z.object({ uai: z.string().optional(), uai_fiable: z.boolean().optional() }).nonstrict()),
  contacts: z.array(zContactReferentiel).describe("Contacts du referentiel").optional(),
  relations: z
    .array(
      z
        .object({
          type: z.enum(["formateur->responsable", "responsable->formateur", "entreprise"]).optional(),
          siret: z.string().optional(),
          uai: z.string().nullable().optional(),
          referentiel: z.boolean().optional(),
          label: z.string().optional(),
          sources: z.array(z.string()).optional(),
        })
        .nonstrict()
    )
    .optional(),
});

export type IContactReferentiel = z.output<typeof zContactReferentiel>;
export type IOrganismeReferentiel = z.output<typeof zOrganismeReferentiel>;

export default { zod: zOrganismeReferentiel, indexes, collectionName };
