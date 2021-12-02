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

module.exports = {
  apiRoles,
  tdbRoles,
};
