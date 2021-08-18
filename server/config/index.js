const env = require("env-var");

module.exports = {
  appName: env.get("TABLEAU_DE_BORD_NAME").default("Tableau de bord de l'apprentissage").asString(),
  env: env.get("TABLEAU_DE_BORD_ENV").required().asString(),
  publicUrl: env.get("TABLEAU_DE_BORD_PUBLIC_URL").required().asString(),
  mongodb: {
    uri: env.get("TABLEAU_DE_BORD_MONGODB_URI").required().asString(),
  },
  ftpDir: env.get("TABLEAU_DE_BORD_FTP_DIR").required().asString(),
  auth: {
    passwordHashRounds: env.get("TABLEAU_DE_BORD_AUTH_PASSWORD_HASH_ROUNDS").asInt(),
    user: {
      jwtSecret: env.get("TABLEAU_DE_BORD_AUTH_USER_JWT_SECRET").required().asString(),
      expiresIn: env.get("TABLEAU_DE_BORD_AUTH_USER_JWT_SECRET_EXPIRES").default("24h").asString(),
    },
    activation: {
      jwtSecret: env.get("TABLEAU_DE_BORD_AUTH_ACTIVATION_JWT_SECRET").required().asString(),
      expiresIn: env.get("TABLEAU_DE_BORD_AUTH_ACTIVATION_JWT_SECRET_EXPIRES").default("96h").asString(),
    },
    password: {
      jwtSecret: env.get("TABLEAU_DE_BORD_AUTH_PASSWORD_JWT_SECRET").required().asString(),
      expiresIn: env.get("TABLEAU_DE_BORD_AUTH_PASSWORD_JWT_SECRET_EXPIRES").default("1h").asString(),
    },
  },
  log: {
    type: env.get("TABLEAU_DE_BORD_LOG_TYPE").default("console").asString(),
    level: env.get("TABLEAU_DE_BORD_LOG_LEVEL").default("info").asString(),
  },
  slackWebhookUrl: env.get("TABLEAU_DE_BORD_SLACK_WEBHOOK_URL").asString(),
  outputDir: env.get("TABLEAU_DE_BORD_OUTPUT_DIR").required().asString(),
  users: {
    ymag: {
      name: env.get("TABLEAU_DE_BORD_USERS_YMAG_NAME").asString(),
      password: env.get("TABLEAU_DE_BORD_USERS_YMAG_PASSWORD").required().asString(),
      permissions: env.get("TABLEAU_DE_BORD_USERS_YMAG_PERMISSIONS").default([]).asArray(),
    },
    gesti: {
      name: env.get("TABLEAU_DE_BORD_USERS_GESTI_NAME").asString(),
      password: env.get("TABLEAU_DE_BORD_USERS_GESTI_PASSWORD").required().asString(),
      permissions: env.get("TABLEAU_DE_BORD_USERS_GESTI_PERMISSIONS").default([]).asArray(),
    },
    scform: {
      name: env.get("TABLEAU_DE_BORD_USERS_SCFORM_NAME").asString(),
      password: env.get("TABLEAU_DE_BORD_USERS_SCFORM_PASSWORD").required().asString(),
      permissions: env.get("TABLEAU_DE_BORD_USERS_SCFORM_PERMISSIONS").default([]).asArray(),
    },
    fca_manager: {
      name: env.get("TABLEAU_DE_BORD_USERS_FCA_MANAGER_NAME").asString(),
      password: env.get("TABLEAU_DE_BORD_USERS_FCA_MANAGER_PASSWORD").required().asString(),
      permissions: env.get("TABLEAU_DE_BORD_USERS_FCA_MANAGER_PERMISSIONS").default([]).asArray(),
    },
    defaultAdmin: {
      name: env.get("TABLEAU_DE_BORD_USERS_DEFAULT_ADMIN_NAME").required().asString(),
      password: env.get("TABLEAU_DE_BORD_USERS_DEFAULT_ADMIN_PASSWORD").required().asString(),
      permissions: env.get("TABLEAU_DE_BORD_USERS_DEFAULT_ADMIN_PERMISSIONS").default([]).asArray(),
    },
  },
  tablesCorrespondances: {
    endpoint: env.get("TABLEAU_DE_BORD_TABLES_CORRESPONDANCES_ENDPOINT_URL").required().asString(),
  },
  mnaCatalogApi: {
    endpoint: env.get("TABLEAU_DE_BORD_MNA_CATALOG_ENDPOINT_URL").required().asString(),
  },
  lbaApi: {
    endpoint: env.get("TABLEAU_DE_BORD_LBA_ENDPOINT_URL").required().asString(),
  },
  ovhStorage: {
    username: env.get("TABLEAU_DE_BORD_OVH_STORAGE_USERNAME").required().asString(),
    password: env.get("TABLEAU_DE_BORD_OVH_STORAGE_PASSWORD").required().asString(),
    authURL: env.get("TABLEAU_DE_BORD_OVH_STORAGE_AUTH_URL").required().asString(),
    tenantId: env.get("TABLEAU_DE_BORD_OVH_STORAGE_TENANT_ID").required().asString(),
    region: env.get("TABLEAU_DE_BORD_OVH_STORAGE_REGION").required().asString(),
    containerName: env.get("TABLEAU_DE_BORD_OVH_STORAGE_CONTAINER_NAME").required().asString(),
  },
};
