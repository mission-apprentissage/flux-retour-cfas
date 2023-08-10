import { OpenAPIRegistry, OpenAPIGenerator, RouteConfig } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";

import dossierApprenantSchema from "@/common/validation/dossierApprenantSchemaV1V2";
import dossierApprenantSchemaV3 from "@/common/validation/dossierApprenantSchemaV3";
import loginSchemaLegacy from "@/common/validation/loginSchemaLegacy";

const dossierApprenantSchemaWithErrors = dossierApprenantSchema().extend({
  validation_errors: z
    .array(
      z.object({
        msg: z.string().openapi({
          description: "Message d'erreur",
          example: '"contrat_date_rupture" must be in iso format',
        }),
        path: z.string().openapi({
          description: "Chemin du champ en erreur",
          type: "string",
          example: "contrat_date_rupture",
        }),
      })
    )
    .optional()
    .openapi({ description: "Erreurs de validation de cet effectif" }),
});

const registry = new OpenAPIRegistry();

const httpAuth = registry.registerComponent("securitySchemes", "httpAuth", {
  description: "Méthode d'authentification pour la V1 et V2, avec un login et un mot de passe",
  type: "http",
  scheme: "basic",
});
const apiKeyAuth = registry.registerComponent("securitySchemes", "apiKeyAuth", {
  description: "Méthode d'authentification pour la V3 avec une clé d'API",
  type: "apiKey",
  name: "api_key",
  in: "header",
});

registry.registerPath({
  method: "post",
  path: "/login",
  summary: "Authentification de l'ERP",
  tags: ["v1", "v2"],
  request: {
    body: {
      required: true,
      content: {
        "application/json": {
          schema: loginSchemaLegacy,
        },
      },
    },
  },
  responses: {
    "200": {
      description: "successful operation",
      content: {
        "application/json": {
          schema: {
            type: "object",
            properties: {
              "400": {
                description: "Invalid username/password supplied",
              },
              access_token: {
                type: "string",
                description: "Token d'authentification",
                example: "<JWT Access token>",
              },
            },
          },
        },
      },
    },
  },
});

const dossierApprenantPostRoute: Omit<RouteConfig, "path"> = {
  method: "post",
  summary: "Import des dossiers apprenants",
  description: "Permet la création ou la mise à jour de plusieurs dossiers apprenants",
  security: [{ [httpAuth.name]: [] }],
  request: {
    body: {
      required: true,
      content: {
        "application/json": {
          schema: z.array(dossierApprenantSchema()),
        },
      },
    },
  },
  responses: {
    "200": {
      description:
        "les dossiers apprenants sont en attente de traitement. Les éventuelles erreurs seront remontées par email.",
      content: {
        "application/json": {
          schema: z.object({
            message: z.string().openapi({
              description: "Queued",
              enum: ["Queued"],
            }),
            data: z.array(dossierApprenantSchemaWithErrors),
          }),
        },
      },
    },
    "400": {
      description: "Les données reçues ne sont pas valides",
    },
    "500": {
      description: "Une erreur est survenue",
    },
  },
};

registry.registerPath({ path: "/status-apprenants", deprecated: true, tags: ["v1"], ...dossierApprenantPostRoute });

registry.registerPath({ path: "/dossiers-apprenants", tags: ["v2"], ...dossierApprenantPostRoute });

registry.registerPath({
  method: "post",
  path: "/v3/dossiers-apprenants",
  summary: "Import des dossiers apprenants",
  description: "Permet la création ou la mise à jour de plusieurs dossiers apprenants",
  security: [{ [apiKeyAuth.name]: [] }],
  tags: ["v3"],
  request: {
    body: {
      required: true,
      content: {
        "application/json": {
          schema: z.array(dossierApprenantSchemaV3(true)),
        },
      },
    },
  },
  responses: {
    "200": {
      description:
        "les dossiers apprenants ont été mise en queue, en attente de traitement. Les éventuels erreurs seront remontées par email.",
      content: {
        "application/json": {
          schema: z.object({
            message: z.string().openapi({
              description: "Queued",
              enum: ["Queued"],
            }),
            data: z.array(dossierApprenantSchemaWithErrors),
          }),
        },
      },
    },
    "500": {
      description: "Une erreur est survenue",
    },
  },
});

const generator = new OpenAPIGenerator(registry.definitions, "3.0.0");

export default generator.generateDocument({
  info: {
    version: "1.0.0",
    title: "API mission apprentissage",
    description:
      "L'API mission apprentissage est à disposition des ERPs et organismes de formation qui souhaitent envoyer leur donnnées effectifs au tableau de bord de l'apprentissage.",
    contact: {
      name: "support",
      email: "tableau-de-bord@apprentissage.beta.gouv.fr",
    },
  },
  externalDocs: {
    description: "Plus d'info sur le tableau de bord de l'apprentissage",
    url: "https://beta.gouv.fr/startups/tdb-apprentissage.html",
  },
  servers: [{ url: "https://cfas.apprentissage.beta.gouv.fr/api" }],
  tags: [
    {
      name: "v1",
      description:
        "Version 2021. L'authentification se fait à l'aide d'un login/mot de passe. Cette version a été déprécié.",
    },
    {
      name: "v2",
      description:
        "Version 2022. L'authentification se fait à l'aide d'un login/mot de passe. Cette version est en cours de dépréciation et sera remplacée par la version 3.",
    },
    {
      name: "v3",
      description: "Version 2023. L'authentification se fait à l'aide d'une apiKey.",
    },
  ],
});
