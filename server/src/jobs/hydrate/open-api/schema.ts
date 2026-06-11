import { OpenAPIRegistry, OpenApiGeneratorV3 } from "@asteasolutions/zod-to-openapi";
import { SourceApprenantEnum, TD_API_ELEMENT_LINK } from "shared/constants";
import { dossierApprenantSchemaV3Base } from "shared/models/parts/dossierApprenantSchemaV3";
import { z } from "zod";

const dossierApprenantSchemaV3WithErrors = dossierApprenantSchemaV3Base.extend({
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
          schema: z.array(dossierApprenantSchemaV3Base.omit({ has_nir: true })),
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

const sipaBearerAuth = registry.registerComponent("securitySchemes", "sipaBearerAuth", {
  description: "JWT obtenu via POST /v2/auth/login (validité 7 jours, scope sipa)",
  type: "http",
  scheme: "bearer",
  bearerFormat: "JWT",
});

const zSipaDate = z
  .string()
  .nullable()
  .openapi({ type: "string", format: "date", description: "Date au format AAAA-MM-JJ (UTC)", example: "2025-09-01" });

const zSipaEffectifDTO = z.object({
  source: z.string().openapi({ description: "Source de la donnée (taille max 10)", enum: ["CFA", "DECA"] }),
  dateActualisation: zSipaDate.openapi({ description: "Date de dernière actualisation de la donnée" }),
  apprenant: z.object({
    ine: z.string().nullable().openapi({ description: "INE de l'apprenant (taille 11) — null si inconnu" }),
    nom: z.string().nullable().openapi({ description: "Nom (taille max 200)" }),
    prenom: z.string().nullable().openapi({ description: "Prénom (taille max 50)" }),
    dateNaissance: zSipaDate,
  }),
  formation: z.object({
    dateDebutFormation: zSipaDate,
    dateFinFormation: zSipaDate,
    dateInscriptionCfa: zSipaDate,
    diplomeNiveau: z
      .string()
      .nullable()
      .openapi({ description: "Niveau du diplôme préparé", enum: ["3", "4", "5"] }),
    intituleDiplome: z
      .string()
      .nullable()
      .openapi({ description: "Intitulé du diplôme ou titre visé (taille max 500)" }),
  }),
  organismeFormation: z.object({
    denomination: z.string().nullable().openapi({ description: "Dénomination de l'organisme (taille max 500)" }),
    uaiCfa: z.string().nullable().openapi({ description: "UAI du lieu de formation (taille 8)" }),
    siret: z.string().nullable().openapi({ description: "SIRET du lieu de formation (taille 14)" }),
    adresse: z.string().nullable().openapi({ description: "Adresse de l'organisme (taille max 870)" }),
    departement: z
      .string()
      .nullable()
      .openapi({ description: "Code département INSEE sur 3 caractères", example: "059" }),
  }),
  contrats: z
    .object({
      dateDebutContrat: zSipaDate,
      dateFinContrat: zSipaDate,
      dateConclusionContrat: zSipaDate.openapi({ description: "Toujours null (non disponible dans le TBA)" }),
    })
    .nullable()
    .openapi({ description: "Dernier contrat d'apprentissage (par date de début) — null si aucun contrat" }),
});

const zSipaErreur = z.object({
  error: z.string().openapi({ example: "Unprocessable Entity" }),
  message: z.string().openapi({ description: "Message d'erreur explicite", example: "Département inconnu : 999" }),
});

registry.registerPath({
  method: "post",
  path: "/v2/auth/login",
  summary: "Authentification SIPA",
  description:
    "Authentifie un compte technique SIPA et retourne un JWT à présenter en `Authorization: Bearer` sur les routes v2. Validité 7 jours.",
  tags: ["v2 - SIPA"],
  request: {
    body: {
      required: true,
      content: {
        "application/json": {
          schema: z.object({
            username: z
              .string()
              .openapi({ description: "Identifiant du compte technique (alphanumérique + . - _, max 64)" }),
            password: z.string().openapi({ description: "Mot de passe (max 128)" }),
          }),
        },
      },
    },
  },
  responses: {
    "200": {
      description: "Authentification réussie",
      content: {
        "application/json": {
          schema: z.object({
            token: z.string().openapi({ description: "JWT (HS256, scope sipa)" }),
            expiresIn: z.number().int().openapi({ description: "Durée de validité en secondes", example: 604800 }),
          }),
        },
      },
    },
    "400": { description: "Corps de requête mal formé" },
    "401": { description: "Identifiant ou mot de passe incorrect" },
    "429": { description: "Trop de tentatives (20 / 15 min par IP)" },
  },
});

registry.registerPath({
  method: "get",
  path: "/v2/affelnet/suivi",
  summary: "Suivi des inscriptions/contrats d'apprentissage (croisement Affelnet)",
  description:
    "Retourne les jeunes de moins de 18 ans inscrits en apprentissage (niveaux 3/4/5) sur la fenêtre de dates et les départements demandés. " +
    "Dédoublonné (DECA prioritaire sur ERP), paginé par 1000. Une page au-delà de totalPages renvoie 200 avec une liste vide.",
  security: [{ [sipaBearerAuth.name]: [] }],
  tags: ["v2 - SIPA"],
  request: {
    query: z.object({
      dateDebutFormationMin: z.string().openapi({
        description: "Borne basse (incluse) de formation.dateDebutFormation, AAAA-MM-JJ",
        example: "2025-06-01",
      }),
      dateDebutFormationMax: z.string().openapi({
        description: "Borne haute (incluse) de formation.dateDebutFormation, AAAA-MM-JJ",
        example: "2025-12-31",
      }),
      departements: z.string().openapi({
        description: "Codes départements INSEE 3 caractères, séparés par des virgules (max 10)",
        example: "059,062",
      }),
      page: z.string().optional().openapi({ description: "Numéro de page (défaut 1)", example: "1" }),
    }),
  },
  responses: {
    "200": {
      description: "Liste paginée des effectifs",
      content: {
        "application/json": {
          schema: z.object({
            metadonnees: z.object({
              page: z.number().int().openapi({ example: 1 }),
              totalPages: z.number().int().openapi({ example: 10 }),
              totalElements: z.number().int().openapi({ example: 9342 }),
            }),
            effectifs: z.array(zSipaEffectifDTO),
          }),
        },
      },
    },
    "400": { description: "Requête mal formatée (paramètre manquant, type non respecté)" },
    "401": { description: "Token manquant, invalide ou expiré, ou compte révoqué" },
    "403": { description: "Token valide mais scope incorrect" },
    "422": {
      description: "Données en entrée non conformes (date invalide, département non conforme, > 10 départements…)",
      content: { "application/json": { schema: zSipaErreur } },
    },
    "500": { description: "Une erreur inattendue est survenue" },
  },
});

const generator = new OpenApiGeneratorV3(registry.definitions);

export default generator.generateDocument({
  openapi: "3.0.0",
  info: {
    version: "1.0.0",
    title: "API mission apprentissage",
    description:
      "L'API mission apprentissage est à disposition des ERPs et organismes de formation qui souhaitent envoyer leurs données effectifs au tableau de bord de l'apprentissage (v3), " +
      "ainsi que des partenaires institutionnels qui consomment les données du tableau de bord, comme SIPA — Éducation Nationale (v2).",
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
    {
      name: "v2 - SIPA",
      description: "Interface dédiée à SIPA. Authentification par compte technique + JWT.",
    },
  ],
});
