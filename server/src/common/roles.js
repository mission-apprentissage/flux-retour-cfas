const apiRoles = {
  apiStatutsSeeder: "apiStatutsSeeder",
  apiStatutsConsumer: { anonymousDataConsumer: "apiAnonymousStatutsDataConsumer" },
  administrator: "administrator",
};

const tdbRoles = {
  administrator: "administrator",
  pilot: "pilot",
  network: "network",
  cfa: "cfa",
};

const PARTAGE_SIMPLIFIE_ROLES = {
  ADMINISTRATOR: "administrator",
  OF: "of",
};

module.exports = {
  apiRoles,
  tdbRoles,
  PARTAGE_SIMPLIFIE_ROLES,
};
