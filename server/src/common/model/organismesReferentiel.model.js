import { object, objectId, string, boolean, number, array } from "./json-schema/jsonSchemaTypes.js";

const collectionName = "organismesReferentiel";

const indexes = () => {
  return [
    [{ siret: 1 }, { unique: true }],
    [{ uai: 1 }],
    [{ "uai_potentiels.uai": 1 }],
    [{ numero_declaration_activite: 1 }],
    [{ nature: 1 }],
    [{ referentiels: 1 }],
    [{ "adresse.departement.code": 1 }],
    [{ "adresse.region.code": 1 }],
    [{ "adresse.academie.code": 1 }],
    [{ "relations.type": 1 }],
    [{ etat_administratif: 1 }],
    [{ qualiopi: 1 }],
    [{ "adresse.geojson.geometry": "2dsphere" }],
    [
      { siret: "text", uai: "text", raison_sociale: "text" },
      { name: "fulltext", default_language: "french" },
    ],
  ];
};

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
  },
  { required: ["siret", "nature"] }
);

export default { schema, indexes, collectionName };
