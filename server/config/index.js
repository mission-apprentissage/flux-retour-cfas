const env = require("env-var");

module.exports = {
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
  mnaTdb: {
    userName: env.get("FLUX_RETOUR_CFAS_MNA_TDB_USER_NAME").default("").asString(),
    userPassword: env.get("FLUX_RETOUR_CFAS_MNA_TDB_USER_PASSWORD").default("").asString(),
  },
  ovhStorage: {
    username: env.get("FLUX_RETOUR_CFAS_OVH_STORAGE_USERNAME").required().asString(),
    password: env.get("FLUX_RETOUR_CFAS_OVH_STORAGE_PASSWORD").required().asString(),
    authURL: env.get("FLUX_RETOUR_CFAS_OVH_STORAGE_AUTH_URL").required().asString(),
    tenantId: env.get("FLUX_RETOUR_CFAS_OVH_STORAGE_TENANT_ID").required().asString(),
    region: env.get("FLUX_RETOUR_CFAS_OVH_STORAGE_REGION").required().asString(),
    containerName: env.get("FLUX_RETOUR_CFAS_OVH_STORAGE_CONTAINER_NAME").required().asString(),
  },
  redis: {
    uri: env.get("FLUX_RETOUR_CFAS_REDIS_URI").required().asString(),
  },
};
