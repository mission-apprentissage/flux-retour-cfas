const assert = require("assert").strict;
const { Cfa } = require("../../../../src/common/domain/cfa");
const pick = require("lodash.pick");

describe("Domain CFA", () => {
  describe("createCfa", () => {
    it("Vérifie la création d'un CFA avec tous les champs", async () => {
      const cfaProps = {
        uai: "0802004U",
        sirets: ["11111111100023"],
        nom: "testCfa",
        adresse: "7 rue de la paix 75016 PARIS",
        erps: ["monErp", "monErp2"],
        region_nom: "Ma region",
        region_num: "17",
        first_transmission_date: new Date(),
      };

      const createdCfaEntity = Cfa.create(cfaProps);
      const initialPropsData = pick(createdCfaEntity, [
        "uai",
        "sirets",
        "nom",
        "adresse",
        "erps",
        "region_nom",
        "region_num",
        "first_transmission_date",
      ]);

      assert.deepEqual(initialPropsData, cfaProps);
      assert.equal(createdCfaEntity.nom_tokenized, Cfa.createTokenizedNom(cfaProps.nom));
      assert.equal(createdCfaEntity.private_url !== null, true);
      assert.equal(createdCfaEntity.access_token !== null, true);
      assert.equal(createdCfaEntity.created_at !== null, true);
      assert.equal(createdCfaEntity.updated_at, null);
    });

    it("Vérifie la création d'un CFA avec tous les champs obligatoires", async () => {
      const cfaProps = {
        uai: "0802004U",
        nom: "testCfa",
      };

      const createdCfaEntity = Cfa.create(cfaProps);
      const initialPropsData = pick(createdCfaEntity, ["uai", "nom"]);

      assert.deepEqual(initialPropsData, cfaProps);
      assert.equal(createdCfaEntity.nom_tokenized, Cfa.createTokenizedNom(cfaProps.nom));
      assert.equal(createdCfaEntity.private_url !== null, true);
      assert.equal(createdCfaEntity.accessToken !== null, true);
      assert.equal(createdCfaEntity.created_at !== null, true);
      assert.equal(createdCfaEntity.updated_at, null);
    });

    it("Vérifie la non création d'un CFA sans uai", async () => {
      const cfaProps = {
        sirets: ["11111111100023"],
        nom: "testCfa",
        adresse: "7 rue de la paix 75016 PARIS",
        erps: ["monErp", "monErp2"],
        region_nom: "Ma region",
        region_num: "17",
        first_transmission_date: new Date(),
      };

      assert.equal(Cfa.create(cfaProps), null);
    });

    it("Vérifie la non création d'un CFA avec uai invalide", async () => {
      const cfaProps = {
        uai: "AAAA",
        sirets: ["11111111100023"],
        nom: "testCfa",
        adresse: "7 rue de la paix 75016 PARIS",
        erps: ["monErp", "monErp2"],
        region_nom: "Ma region",
        region_num: "17",
        first_transmission_date: new Date(),
      };

      const createdCfaEntity = Cfa.create(cfaProps);

      assert.equal(createdCfaEntity, null);
    });
  });
});
