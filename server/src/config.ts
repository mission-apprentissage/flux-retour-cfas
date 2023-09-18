import env from "env-var";

const config = {
  email: env.get("MNA_TDB_EMAIL").default("tableau-de-bord@apprentissage.beta.gouv.fr").asString(),
  email_from: env.get("MNA_TDB_EMAIL_FROM").default("Tableau de bord de l'apprentissage").asString(),
  appName: env.get("MNA_TDB_NAME").default("Flux Retour Cfas").asString(),
  version: env.get("PUBLIC_VERSION").default("0.0.0-local").asString(),
  port: env.get("MNA_TDB_SERVER_PORT").default(5000).asPortNumber(),
  env: env.get("MNA_TDB_ENV").required().asString(),
  publicUrl: env.get("MNA_TDB_PUBLIC_URL").required().asString(),
  bodyParserLimit: env.get("MNA_TDB_BODY_PARSER_LIMIT").default("10mb").asString(),
  mongodb: {
    uri: env.get("MNA_TDB_MONGODB_URI").required().asString(),
  },
  auth: {
    passwordHashRounds: 10000,
    user: {
      jwtSecret: env.get("MNA_TDB_AUTH_USER_JWT_SECRET").required().asString(),
      expiresIn: "7d",
    },
    activation: {
      jwtSecret: env.get("MNA_TDB_AUTH_ACTIVATION_JWT_SECRET").asString(),
      expiresIn: "96h",
    },
    resetPasswordToken: {
      jwtSecret: env.get("MNA_TDB_AUTH_PASSWORD_JWT_SECRET").asString(),
      expiresIn: "1h",
    },
  },
  log: {
    type: env.get("MNA_TDB_LOG_TYPE").default("json").asString(),
    level: env.get("MNA_TDB_LOG_LEVEL").default("info").asString(),
  },
  users: {
    defaultAdmin: {
      name: env.get("MNA_TDB_USERS_DEFAULT_ADMIN_NAME").required().asString(),
      password: env.get("MNA_TDB_USERS_DEFAULT_ADMIN_PASSWORD").required().asString(),
      permissions: env.get("MNA_TDB_USERS_DEFAULT_ADMIN_PERMISSIONS").default([]).asArray(),
    },
  },
  smtp: {
    host: env.get("MNA_TDB_SMTP_HOST").asString(),
    port: env.get("MNA_TDB_SMTP_PORT").asString(),
    auth: {
      user: env.get("MNA_TDB_SMTP_AUTH_USER").asString(),
      pass: env.get("MNA_TDB_SMTP_AUTH_PASS").asString(),
    },
  },
  clamav: {
    uri: env.get("MNA_TDB_CLAMAV_URI").default("127.0.0.1:3310").asString(),
  },
  ovhStorage: {
    username: env.get("MNA_TDB_OVH_STORAGE_USERNAME").required().asString(),
    password: env.get("MNA_TDB_OVH_STORAGE_PASSWORD").required().asString(),
    authURL: "https://auth.cloud.ovh.net/v3/auth",
    tenantId: env.get("MNA_TDB_OVH_STORAGE_TENANT_ID").required().asString(),
    region: "GRA",
    containerName: env.get("MNA_TDB_OVH_STORAGE_CONTAINER_NAME").required().asString(),
    encryptionKey: env.get("MNA_TDB_OVH_STORAGE_ENCRYPTION_KEY").required().asString(),
  },
  ovh: {
    storage: {
      encryptionKey: env.get("MNA_TDB_OVH_STORAGE_ENCRYPTION_KEY").asString(),
      uri: env.get("MNA_TDB_OVH_STORAGE_URI").asString(),
      storageName: env.get("MNA_TDB_OVH_STORAGE_CONTAINER_NAME").asString(),
    },
  },
  sentry: {
    dsn: env.get("MNA_TDB_SENTRY_DSN").asString(),
  },
  organismesConsultationApiKey: env.get("MNA_TDB_ORGANISMES_CONSULTATION_API_KEY").asString(),

  // API métiers externes
  tablesCorrespondances: {
    endpoint: "https://tables-correspondances.apprentissage.beta.gouv.fr/api",
  },
  mnaCatalogApi: {
    endpoint: "https://catalogue.apprentissage.beta.gouv.fr/api",
  },
  lbaApi: {
    endpoint: "https://labonnealternance.apprentissage.beta.gouv.fr/api",
  },
  mnaReferentielApi: {
    endpoint: "https://referentiel.apprentissage.onisep.fr/api/v1",
  },
  apiEntreprise: {
    endpoint: "https://entreprise.api.gouv.fr/v3",
    key: env.get("MNA_TDB_API_ENTREPRISE_KEY").asString(),
    defaultRecipient: "13002526500013", // Siret DINUM
    object: "Consolidation des données",
    context: "MNA",
  },
  decaApi: {
    endpoint: env.get("MNA_TDB_API_DECA_URL").asString(),
    login: env.get("MNA_TDB_API_DECA_LOGIN").asString(),
    password: env.get("MNA_TDB_API_DECA_PASSWORD").asString(),
  },
  disable_processors: env.get("FLUX_RETOUR_CFAS_DISABLE_PROCESSORS").default("false").asBool(),
};

export default config;
