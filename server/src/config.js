import env from "env-var";

export const config = {
  email: env.get("FLUX_RETOUR_CFAS_EMAIL").default("tableau-de-bord@apprentissage.beta.gouv.fr").asString(),
  appName: env.get("FLUX_RETOUR_CFAS_NAME").default("Flux Retour Cfas").asString(),
  env: env.get("FLUX_RETOUR_CFAS_ENV").required().asString(),
  publicUrl: env.get("FLUX_RETOUR_CFAS_PUBLIC_URL").required().asString(),
  mongodb: {
    uri: env.get("FLUX_RETOUR_CFAS_MONGODB_URI").required().asString(),
  },
  auth: {
    passwordHashRounds: env.get("FLUX_RETOUR_CFAS_AUTH_PASSWORD_HASH_ROUNDS").asInt(),
    user: {
      jwtSecret: env.get("FLUX_RETOUR_CFAS_AUTH_USER_JWT_SECRET").required().asString(),
      expiresIn: env.get("FLUX_RETOUR_CFAS_AUTH_USER_JWT_SECRET_EXPIRES").default("24h").asString(),
    },
    activation: {
      jwtSecret: env.get("FLUX_RETOUR_CFAS_AUTH_ACTIVATION_JWT_SECRET").asString(),
      expiresIn: "96h",
    },
    actionToken: {
      jwtSecret: env.get("FLUX_RETOUR_CFAS__AUTH_ACTION_TOKEN_JWT_SECRET").asString(),
      expiresIn: "90 days",
    },
    resetPasswordToken: {
      jwtSecret: env.get("FLUX_RETOUR_CFAS_AUTH_PASSWORD_JWT_SECRET").asString(),
      expiresIn: "1h",
    },
    apiToken: {
      jwtSecret: env.get("FLUX_RETOUR_CFAS_AUTH_API_TOKEN_JWT_SECRET").asString(),
      expiresIn: "24h",
    },
  },
  log: {
    type: env.get("FLUX_RETOUR_CFAS_LOG_TYPE").default("console").asString(),
    level: env.get("FLUX_RETOUR_CFAS_LOG_LEVEL").default("info").asString(),
    streams: env.get("FLUX_RETOUR_CFAS_LOG_STREAMS").default([]).asArray(),
  },
  slackWebhookUrl: env.get("FLUX_RETOUR_CFAS_SLACK_WEBHOOK_URL").asString(),
  users: {
    defaultAdmin: {
      name: env.get("FLUX_RETOUR_CFAS_USERS_DEFAULT_ADMIN_NAME").required().asString(),
      password: env.get("FLUX_RETOUR_CFAS_USERS_DEFAULT_ADMIN_PASSWORD").required().asString(),
      permissions: env.get("FLUX_RETOUR_CFAS_USERS_DEFAULT_ADMIN_PERMISSIONS").default([]).asArray(),
    },
  },
  tablesCorrespondances: {
    endpoint: env.get("FLUX_RETOUR_CFAS_TABLES_CORRESPONDANCES_ENDPOINT_URL").required().asString(),
  },
  mnaCatalogApi: {
    endpoint: env.get("FLUX_RETOUR_CFAS_MNA_CATALOG_ENDPOINT_URL").required().asString(),
  },
  lbaApi: {
    endpoint: env.get("FLUX_RETOUR_CFAS_LBA_ENDPOINT_URL").required().asString(),
  },
  mnaReferentielApi: {
    endpoint: env.get("FLUX_RETOUR_CFAS_MNA_REFERENTIEL_ENDPOINT_URL").required().asString(),
  },
  smtp: {
    host: env.get("FLUX_RETOUR_CFAS_SMTP_HOST").asString(),
    port: env.get("FLUX_RETOUR_CFAS_SMTP_PORT").asString(),
    auth: {
      user: env.get("FLUX_RETOUR_CFAS_SMTP_AUTH_USER").asString(),
      pass: env.get("FLUX_RETOUR_CFAS_SMTP_AUTH_PASS").asString(),
    },
  },
  clamav: {
    uri: env.get("FLUX_RETOUR_CFAS_CLAMAV_URI").default("127.0.0.1:3310").asString(),
  },
  ovhStorage: {
    username: env.get("FLUX_RETOUR_CFAS_OVH_STORAGE_USERNAME").required().asString(),
    password: env.get("FLUX_RETOUR_CFAS_OVH_STORAGE_PASSWORD").required().asString(),
    authURL: env.get("FLUX_RETOUR_CFAS_OVH_STORAGE_AUTH_URL").required().asString(),
    tenantId: env.get("FLUX_RETOUR_CFAS_OVH_STORAGE_TENANT_ID").required().asString(),
    region: env.get("FLUX_RETOUR_CFAS_OVH_STORAGE_REGION").required().asString(),
    containerName: env.get("FLUX_RETOUR_CFAS_OVH_STORAGE_CONTAINER_NAME").required().asString(),
    encryptionKey: env.get("FLUX_RETOUR_CFAS_OVH_STORAGE_ENCRYPTION_KEY").required().asString(),
  },
  ovh: {
    storage: {
      encryptionKey: env.get("FLUX_RETOUR_CFAS_OVH_STORAGE_ENCRYPTION_KEY").asString(),
      uri: env.get("FLUX_RETOUR_CFAS_OVH_STORAGE_URI").asString(),
      storageName: env.get("FLUX_RETOUR_CFAS_OVH_STORAGE_CONTAINER_NAME").asString(),
    },
  },
  redis: {
    uri: env.get("FLUX_RETOUR_CFAS_REDIS_URI").default("redis://127.0.0.1:6379").asString(),
  },
  apiEntreprise: env.get("FLUX_RETOUR_CFAS_API_ENTREPRISE_KEY").asString(),
};

export default config;
