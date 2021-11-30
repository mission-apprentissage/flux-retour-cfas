const env = require("env-var");

module.exports = {
  appName: env.get("FLUX_RETOUR_CFAS_NAME").default("Flux Retour Cfas").asString(),
  env: env.get("FLUX_RETOUR_CFAS_ENV").required().asString(),
  publicUrl: env.get("FLUX_RETOUR_CFAS_PUBLIC_URL").required().asString(),
  mongodb: {
    uri: env.get("FLUX_RETOUR_CFAS_MONGODB_URI").required().asString(),
  },
  elasticSearch: {
    uri: env.get("FLUX_RETOUR_CFAS_ELASTIC_SEARCH_URI").asString(),
  },
  auth: {
    passwordHashRounds: env.get("FLUX_RETOUR_CFAS_AUTH_PASSWORD_HASH_ROUNDS").asInt(),
    user: {
      jwtSecret: env.get("FLUX_RETOUR_CFAS_AUTH_USER_JWT_SECRET").required().asString(),
      expiresIn: env.get("FLUX_RETOUR_CFAS_AUTH_USER_JWT_SECRET_EXPIRES").default("24h").asString(),
    },
    activation: {
      jwtSecret: env.get("FLUX_RETOUR_CFAS_AUTH_ACTIVATION_JWT_SECRET").required().asString(),
      expiresIn: env.get("FLUX_RETOUR_CFAS_AUTH_ACTIVATION_JWT_SECRET_EXPIRES").default("96h").asString(),
    },
    password: {
      jwtSecret: env.get("FLUX_RETOUR_CFAS_AUTH_PASSWORD_JWT_SECRET").required().asString(),
      expiresIn: env.get("FLUX_RETOUR_CFAS_AUTH_PASSWORD_JWT_SECRET_EXPIRES").default("1h").asString(),
    },
  },
  log: {
    type: env.get("FLUX_RETOUR_CFAS_LOG_TYPE").default("console").asString(),
    level: env.get("FLUX_RETOUR_CFAS_LOG_LEVEL").default("info").asString(),
    streams: env.get("FLUX_RETOUR_CFAS_LOG_STREAMS").default([]).asArray(),
  },
  slackWebhookUrl: env.get("FLUX_RETOUR_CFAS_SLACK_WEBHOOK_URL").asString(),
  outputDir: env.get("FLUX_RETOUR_CFAS_OUTPUT_DIR").required().asString(),
  users: {
    ymag: {
      name: env.get("FLUX_RETOUR_CFAS_USERS_YMAG_NAME").asString(),
      password: env.get("FLUX_RETOUR_CFAS_USERS_YMAG_PASSWORD").required().asString(),
      permissions: env.get("FLUX_RETOUR_CFAS_USERS_YMAG_PERMISSIONS").default([]).asArray(),
    },
    gesti: {
      name: env.get("FLUX_RETOUR_CFAS_USERS_GESTI_NAME").asString(),
      password: env.get("FLUX_RETOUR_CFAS_USERS_GESTI_PASSWORD").required().asString(),
      permissions: env.get("FLUX_RETOUR_CFAS_USERS_GESTI_PERMISSIONS").default([]).asArray(),
    },
    scform: {
      name: env.get("FLUX_RETOUR_CFAS_USERS_SCFORM_NAME").asString(),
      password: env.get("FLUX_RETOUR_CFAS_USERS_SCFORM_PASSWORD").required().asString(),
      permissions: env.get("FLUX_RETOUR_CFAS_USERS_SCFORM_PERMISSIONS").default([]).asArray(),
    },
    fca_manager: {
      name: env.get("FLUX_RETOUR_CFAS_USERS_FCA_MANAGER_NAME").asString(),
      password: env.get("FLUX_RETOUR_CFAS_USERS_FCA_MANAGER_PASSWORD").required().asString(),
      permissions: env.get("FLUX_RETOUR_CFAS_USERS_FCA_MANAGER_PERMISSIONS").default([]).asArray(),
    },
    aurion: {
      name: env.get("FLUX_RETOUR_CFAS_USERS_AURION_NAME").asString(),
      password: env.get("FLUX_RETOUR_CFAS_USERS_AURION_PASSWORD").required().asString(),
      permissions: env.get("FLUX_RETOUR_CFAS_USERS_AURION_PERMISSIONS").default([]).asArray(),
    },
    rco: {
      name: env.get("FLUX_RETOUR_CFAS_USERS_RCO_NAME").required().asString(),
      password: env.get("FLUX_RETOUR_CFAS_USERS_RCO_PASSWORD").required().asString(),
      permissions: env.get("FLUX_RETOUR_CFAS_USERS_RCO_PERMISSIONS").default([]).asArray(),
    },
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
