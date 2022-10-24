const assert = require("assert").strict;
const demandesActivationComptePartageSimplifie = require("../../../../src/common/components/demandesActivationComptePartageSimplifie.js");
const { COLLECTIONS_NAMES } = require("../../../../src/common/model/collections.js");
const { dbCollection } = require("../../../../src/common/mongodb.js");

describe("Composant demandesActivationComptePartageSimplifie", () => {
  describe("createDemandeActivationCompte", () => {
    it("Permet de créer une demande d'activation de compte et de le sauver en base", async () => {
      const { createDemandeActivationCompte } = demandesActivationComptePartageSimplifie();

      await createDemandeActivationCompte("test@test.fr");
      const foundInDb = await dbCollection(COLLECTIONS_NAMES.PsDemandesActivationCompte).findOne({
        email: "test@test.fr",
      });

      assert.ok(foundInDb);
      assert.equal(foundInDb.created_at !== null, true);
    });

    it("Ne créé pas de demande d'activation de compte si l'email est au mauvais format", async () => {
      const { createDemandeActivationCompte } = demandesActivationComptePartageSimplifie();

      await createDemandeActivationCompte(123);
      const foundInDb = await dbCollection(COLLECTIONS_NAMES.PsDemandesActivationCompte).findOne({
        email: "test@test.fr",
      });

      assert.equal(foundInDb === null, true);
    });
  });
});
