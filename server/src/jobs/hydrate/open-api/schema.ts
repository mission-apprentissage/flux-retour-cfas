import { OpenAPIRegistry, OpenApiGeneratorV3 } from "@asteasolutions/zod-to-openapi";
import { SourceApprenantEnum, TD_API_ELEMENT_LINK } from "shared/constants";
import { dossierApprenantSchemaV3Base } from "shared/models/parts/dossierApprenantSchemaV3";
import { z } from "zod";

const dossierApprenantSchemaV3WithErrors = dossierApprenantSchemaV3Base().extend({
  validation_errors: z
    .array(
      z.object({
        message: z.string().openapi({
          description: "Message d'erreur",
          example: '"contrat_date_rupture" must be in iso format',
        }),
        path: z.array(
          z.string().openapi({
            description: "Chemin du ou des champs en erreur",
            type: "string",
            example: '["contrat_date_rupture"]',
          })
        ),
      })
    )
    .optional()
    .openapi({ description: "Erreurs de validation de cet effectif" }),
  updated_at: z.string().openapi({
    description: "Date de mise à jour de l'effectif",
    type: "string",
    format: "YYYY-MM-DDT00:00:00Z",
  }),
  created_at: z.string().openapi({
    description: "Date de création de l'effectif",
    type: "string",
    format: "YYYY-MM-DDT00:00:00Z",
  }),
  processed_at: z.string().optional().openapi({
    description: "Date de traitement de l'effectif",
    type: "string",
    format: "YYYY-MM-DDT00:00:00Z",
  }),
  source: SourceApprenantEnum.openapi({
    description: "Source de l'effectif (nom de l'ERP)",
    type: "string",
    example: "ERP",
  }),
  source_organisme_id: z.string().openapi({
    description: "Identifiant interne de l'organisme qui a envoyé l'effectif",
    type: "string",
  }),
  api_version: z.string().openapi({
    description: "Version de l'API utilisée",
    type: "string",
    example: "v3",
  }),
  _id: z.string().openapi({
    description: "Identifiant unique (interne) de l'effectif",
    type: "string",
  }),
});

const registry = new OpenAPIRegistry();

const bearerAuth = registry.registerComponent("securitySchemes", "apiKeyAuth", {
  description: "Méthode d'authentification pour la V3 avec une clé d'API",
  type: "http",
  scheme: "bearer",
});

registry.registerPath({
  method: "post",
  path: "/v3/dossiers-apprenants",
  summary: "Import des dossiers apprenants",
  description: "Permet la création ou la mise à jour de plusieurs dossiers apprenants",
  security: [{ [bearerAuth.name]: [] }],
  tags: ["v3"],
  request: {
    body: {
      required: true,
      content: {
        "application/json": {
          schema: z.array(dossierApprenantSchemaV3Base().omit({ has_nir: true })),
        },
      },
    },
  },
  responses: {
    "200": {
      description:
        "Les dossiers apprenants ont été mis en file d'attente.\nLa liste des données en erreurs peut être consultée dans le champ `validation_errors` ",
      content: {
        "application/json": {
          schema: z.object({
            status: z.string().openapi({
              description: "OK",
              enum: ["OK"],
            }),
            detail: z.string().optional(),
            message: z.string().openapi({
              description: "Queued",
              enum: ["Queued"],
            }),
            data: z.array(dossierApprenantSchemaV3WithErrors),
          }),
        },
      },
    },
    "403": {
      description: "La clé d'API n'est pas valide.",
      content: {
        "application/json": {
          schema: z.object({
            error: z.string().openapi({
              description: "Forbidden",
              enum: ["Forbidden"],
            }),
            message: z.string().openapi({
              description: "La clé API n'est pas valide",
              enum: ["Clé API manquante", "La clé API n'est pas valide", "La clé API doit etre au format Bearer"],
            }),
          }),
        },
      },
    },
    "500": {
      description: "Une erreur inattendue est survenue",
    },
  },
});

const generator = new OpenApiGeneratorV3(registry.definitions);

export default generator.generateDocument({
  openapi: "3.0.0",
  info: {
    version: "1.0.0",
    title: "API mission apprentissage",
    description:
      "L'API mission apprentissage est à disposition des ERPs et organismes de formation qui souhaitent envoyer leur donnnées effectifs au tableau de bord de l'apprentissage.",
    contact: {
      url: TD_API_ELEMENT_LINK,
      name: "API Support",
    },
  },
  externalDocs: {
    description: "Télécharger le modèle OpenAPI",
    url: "https://cfas.apprentissage.beta.gouv.fr/api/openapi-model",
  },
  servers: [{ url: "https://cfas.apprentissage.beta.gouv.fr/api" }],
  tags: [
    {
      name: "v3",
      description: "Version 2023. L'authentification se fait à l'aide d'une apiKey.",
    },
  ],
});
