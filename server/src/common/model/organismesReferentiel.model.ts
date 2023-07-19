import { CreateIndexesOptions, IndexSpecification } from "mongodb";

import { object, objectId, string, boolean, number, array, arrayOf, stringOrNull } from "./json-schema/jsonSchemaTypes";

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

const schema = object(
  {
    _id: objectId(),
    siret: string(),
    uai: string(),
    raison_sociale: string(),
    enseigne: string(),
    siege_social: boolean(),
    numero_declaration_activite: string(),
    etat_administratif: string({ enum: ["actif", "fermé"] }),
    nature: string({ enum: ["responsable", "formateur", "responsable_formateur", "inconnue"] }),
    adresse: object(
      {
        label: string(),
        code_postal: string(),
        code_insee: string(),
        localite: string(),
        departement: object(
          {
            code: string(),
            nom: string(),
          },
          { required: ["code", "nom"] }
        ),
        region: object(
          {
            code: string(),
            nom: string(),
          },
          { required: ["code", "nom"] }
        ),
        academie: object(
          {
            code: string(),
            nom: string(),
          },
          { required: ["code", "nom"] }
        ),
        geojson: object(
          {
            type: string(),
            geometry: object(
              {
                type: string(),
                coordinates: array(),
              },
              { required: ["type", "coordinates"] }
            ),
            properties: object({
              score: number(),
              source: string(),
            }),
          },
          { required: ["type", "geometry"] }
        ),
      },
      { required: ["code_postal", "code_insee", "localite", "region", "academie"] }
    ),
    forme_juridique: object(
      {
        code: string(),
        label: string(),
      },
      { required: ["code", "label"] }
    ),
    qualiopi: boolean(),
    lieux_de_formation: arrayOf(object({ uai: string(), uai_fiable: boolean() }, { additionalProperties: true })),
    contacts: arrayOf(
      object(
        {
          email: string(),
          confirmé: boolean(),
          date_collecte: string(),
          sources: arrayOf(string()),
        },
        { additionalProperties: true }
      ),
      {
        description: "Formations de cet organisme",
      }
    ),
    relations: arrayOf(
      object(
        {
          type: string({
            enum: ["formateur->responsable", "responsable->formateur", "entreprise"],
          }),
          siret: string(),
          uai: stringOrNull(),
          referentiel: boolean(),
          label: string(),
          sources: arrayOf(string()),
        },
        { additionalProperties: true }
      )
    ),
  },
  { required: ["siret", "nature", "lieux_de_formation"] }
);

export default { schema, indexes, collectionName };
