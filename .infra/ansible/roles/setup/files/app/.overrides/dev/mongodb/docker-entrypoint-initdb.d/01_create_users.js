/* eslint-disable */

db.getSiblingDB("{{ vault.DB_SIBLING_NAME }}").createRole({
  role: "app",
  roles: [{ role: "readWrite", db: "{{ vault.DB_NAME }}" }],
  privileges: [
    {
      resource: { db: "{{ vault.DB_NAME }}", collection: "" },
      actions: ["collMod", "createIndex", "listCollections", "bypassDocumentValidation"],
    },
  ],
});

db.getSiblingDB("{{ vault.DB_SIBLING_NAME }}").createUser({
  user: "{{ vault[env_type].FLUX_RETOUR_CFAS_MONGODB_USER }}",
  pwd: "{{ vault[env_type].FLUX_RETOUR_CFAS_MONGODB_USER_PASSWORD }}",
  roles: ["app"],
});

db.getSiblingDB("{{ vault.DB_SIBLING_NAME }}").createUser({
  user: "{{ vault[env_type].FLUX_RETOUR_CFAS_MONGODB_ADMIN_USER }}",
  pwd: "{{ vault[env_type].FLUX_RETOUR_CFAS_MONGODB_ADMIN_PASSWORD }}",
  roles: [
    { role: "userAdminAnyDatabase", db: "{{ vault.DB_ADMIN_NAME }}" },
    { role: "readWriteAnyDatabase", db: "{{ vault.DB_ADMIN_NAME }}" },
    { role: "dbAdminAnyDatabase", db: "{{ vault.DB_ADMIN_NAME }}" },
    { role: "clusterAdmin", db: "{{ vault.DB_ADMIN_NAME }}" },
  ],
});

db.getSiblingDB("{{ vault.DB_SIBLING_NAME }}").createUser({
  user: "{{ vault[env_type].FLUX_RETOUR_CFAS_MONGODB_METABASE_USER }}",
  pwd: "{{ vault[env_type].FLUX_RETOUR_CFAS_MONGODB_METABASE_PASSWORD }}",
  roles: [{ role: "read", db: "{{ vault.DB_ADMIN_NAME }}" }],
});
