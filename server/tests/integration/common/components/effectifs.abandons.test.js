const assert = require("assert").strict;
const {
  createRandomDossierApprenantAbandon,
  createRandomDossierApprenantApprenti,
  createRandomDossierApprenantInscritSansContrat,
} = require("../../../data/randomizedSample");
const { DossierApprenantModel } = require("../../../../src/common/model");
const { EffectifsAbandons } = require("../../../../src/common/components/effectifs/abandons");

describe(__filename, () => {
  const seedDossiersApprenants = async (statutsProps) => {
    const abandonsStatuts = [];

    for (let index = 0; index < 10; index++) {
      const randomStatut = createRandomDossierApprenantAbandon(statutsProps);
      const toAdd = new DossierApprenantModel(randomStatut);
      abandonsStatuts.push(toAdd);
      await toAdd.save();
    }

    for (let index = 0; index < 5; index++) {
      const randomStatut = createRandomDossierApprenantApprenti(statutsProps);
      const toAdd = new DossierApprenantModel(randomStatut);
      await toAdd.save();
    }

    for (let index = 0; index < 15; index++) {
      const randomStatut = createRandomDossierApprenantInscritSansContrat(statutsProps);
      const toAdd = new DossierApprenantModel(randomStatut);
      await toAdd.save();
    }

    return abandonsStatuts;
  };

  const abandons = new EffectifsAbandons();

  describe("Abandons - getCountAtDate", () => {
    it("gets count of abandons at yet another date", async () => {
      await seedDossiersApprenants();

      const date = new Date();
      const abandonsCount = await abandons.getCountAtDate(date);

      assert.equal(abandonsCount, 10);
    });

    it("gets count of abandons at a date when there was no data", async () => {
      await seedDossiersApprenants();

      const date = new Date("2010-10-10T00:00:00.000+0000");
      const abandonsCount = await abandons.getCountAtDate(date);

      assert.equal(abandonsCount, 0);
    });

    it("gets count of abandons at a date and for a region", async () => {
      const filters = { etablissement_num_region: "28" };
      await seedDossiersApprenants(filters);

      const date = new Date();
      const abandonsCountForRegion = await abandons.getCountAtDate(date, filters);

      assert.equal(abandonsCountForRegion, 10);

      const abandonsCountForAnotherRegion = await abandons.getCountAtDate(date, { etablissement_num_region: "100" });
      assert.equal(abandonsCountForAnotherRegion, 0);
    });
  });

  describe("Abandons - getListAtDate", () => {
    it("gets list of abandons at date with data", async () => {
      const abandonsStatuts = await seedDossiersApprenants();

      const date = new Date();
      const abandonsList = await abandons.getListAtDate(date);

      assert.equal(abandonsList.length, abandonsStatuts.length);
    });

    it("gets list of abandons at date with data - checks projection fields", async () => {
      const abandonsStatuts = await seedDossiersApprenants();

      const date = new Date();
      const projection = {
        uai_etablissement: 1,
        nom_etablissement: 1,
        formation_cfd: 1,
        annee_scolaire: 1,
      };
      const abandonsList = await abandons.getListAtDate(date, {}, { projection });

      assert.equal(abandonsList.length, abandonsStatuts.length);

      for (let index = 0; index < abandonsStatuts.length; index++) {
        assert.equal(abandonsList[index].uai_etablissement !== undefined, true);
        assert.equal(abandonsList[index].nom_etablissement !== undefined, true);
        assert.equal(abandonsList[index].formation_cfd !== undefined, true);
        assert.equal(abandonsList[index].annee_scolaire !== undefined, true);
      }
    });

    it("gets list of abandons at a date when there was no data", async () => {
      await seedDossiersApprenants();

      const date = new Date("2010-10-10T00:00:00.000+0000");
      const abandonsList = await abandons.getListAtDate(date);

      assert.equal(abandonsList.length, 0);
    });

    it("gets list of abandons at a date and for a region", async () => {
      const filters = { etablissement_num_region: "28" };
      const abandonsStatuts = await seedDossiersApprenants(filters);

      const date = new Date();
      const abandonsList = await abandons.getListAtDate(date, filters);

      assert.equal(abandonsList.length, abandonsStatuts.length);

      const abandonsListForOtherRegion = await abandons.getListAtDate(date, { etablissement_num_region: "100" });
      assert.equal(abandonsListForOtherRegion.length, 0);
    });
  });
});
