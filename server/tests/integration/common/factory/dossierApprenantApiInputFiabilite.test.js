const assert = require("assert").strict;
// eslint-disable-next-line node/no-unpublished-require
const MockDate = require("mockdate");
const {
  DossierApprenantApiInputFiabilite,
} = require("../../../../src/common/factory/dossierApprenantApiInputFiabilite");
const omit = require("lodash.omit");

describe("Factory DossierApprenantApiInputFiabilite", () => {
  beforeEach(() => {
    MockDate.reset();
  });
  describe("create", () => {
    it("Vérifie la création d'un DossierApprenantApiInputFiabilite", async () => {
      const fakeNow = new Date();
      MockDate.set(fakeNow);
      const props = {
        analysisId: "abc-123-xxx",
        analysisTimestamp: 123456,
        originalData: {
          prenom_apprenant: "John",
          nom_apprenant: "Doe",
        },
        erp: "tdb",
        sentOnDate: new Date(),
        nomApprenantPresent: true,
        nomApprenantFormatValide: false,
        prenomApprenantPresent: true,
        prenomApprenantFormatValide: true,
      };

      const entity = DossierApprenantApiInputFiabilite.create(props);
      assert.equal(entity.createdAt.getTime(), fakeNow.getTime());
      assert.deepEqual(omit(entity, "createdAt"), props);
    });
  });
});
