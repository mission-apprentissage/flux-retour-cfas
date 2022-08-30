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
    it("Vérifie la création d'un DossierApprenantApiInputFiabilite", () => {
      const analysisDate = new Date();
      const fakeNow = new Date();
      MockDate.set(fakeNow);
      const props = {
        analysisId: "abc-123-xxx",
        analysisDate,
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
        ineApprenantPresent: true,
        ineApprenantFormatValide: false,
        dateDeNaissanceApprenantPresent: true,
        dateDeNaissanceApprenantFormatValide: false,
        codeCommuneInseeApprenantPresent: true,
        codeCommuneInseeApprenantFormatValide: true,
        telephoneApprenantPresent: true,
        telephoneApprenantFormatValide: true,
        emailApprenantPresent: true,
        emailApprenantFormatValide: false,
        uaiEtablissementPresent: true,
        uaiEtablissementFormatValide: false,
        siretEtablissementPresent: false,
        siretEtablissementFormatValide: true,
        uaiEtablissementUniqueFoundInReferentiel: true,
        siretEtablissementFoundInReferentiel: false,
        uniqueApprenant: true,
      };

      const entity = DossierApprenantApiInputFiabilite.create(props);
      assert.equal(entity.createdAt.getTime(), fakeNow.getTime());
      assert.deepEqual(omit(entity, "createdAt"), props);
    });
  });
});
