const assert = require("assert").strict;
const cfasComponent = require("../../../../src/common/components/cfas");
const { StatutCandidatModel, CfaModel } = require("../../../../src/common/model");
const { createRandomStatutCandidat } = require("../../../data/randomizedSample");
const { addDays } = require("date-fns");
const { Cfa } = require("../../../../src/common/domain/cfa");

describe(__filename, () => {
  describe("searchCfas", () => {
    const { searchCfas } = cfasComponent();

    const cfaSeed = [
      {
        nom: "AFTRAL Amiens",
        uai: "0802004U",
      },
      {
        nom: "AFTRAL Pau",
        uai: "0642119F",
      },
      {
        nom: "AFTRAL Nice",
        uai: "0061989E",
      },
      {
        nom: "BTP CFA Somme",
        uai: "0801302F",
      },
    ];

    const statutsSeed = [
      {
        ...createRandomStatutCandidat(),
        uai_etablissement: cfaSeed[0].uai,
        etablissement_num_departement: "80",
        etablissement_num_region: "01",
        etablissement_reseaux: "AFTRAL",
      },
      {
        ...createRandomStatutCandidat(),
        uai_etablissement: cfaSeed[1].uai,
        etablissement_num_departement: "64",
        etablissement_num_region: "02",
        etablissement_reseaux: "AFTRAL",
      },
      {
        ...createRandomStatutCandidat(),
        uai_etablissement: cfaSeed[2].uai,
        etablissement_num_departement: "06",
        etablissement_num_region: "03",
        etablissement_reseaux: "AFTRAL",
      },
      {
        ...createRandomStatutCandidat(),
        uai_etablissement: cfaSeed[3].uai,
        etablissement_num_departement: "80",
        etablissement_num_region: "01",
        etablissement_reseaux: "BTP",
      },
    ];

    beforeEach(async () => {
      for (let i = 0; i < cfaSeed.length; i++) {
        const newCfa = new CfaModel({ ...cfaSeed[i], nom_tokenized: Cfa.createTokenizedNom(cfaSeed[i].nom) });
        await newCfa.save();
      }

      for (let i = 0; i < statutsSeed.length; i++) {
        const statut = statutsSeed[i];
        await new StatutCandidatModel(statut).save();
      }
    });

    it("throws error when no parameter passed", async () => {
      try {
        await searchCfas();
      } catch (err) {
        assert.ok(err);
      }
    });

    it("returns [] when no CFA found", async () => {
      const cfa = await searchCfas({ searchTerm: "blabla" });
      assert.deepEqual(cfa, []);
    });

    it("returns all cfas when no parameter passed", async () => {
      const cfasFound = await searchCfas({});
      assert.equal(cfasFound.length, cfaSeed.length);
      const allUaiFound = cfasFound.map((cfa) => cfa.uai);
      const allUaiSeed = cfaSeed.map((cfa) => cfa.uai);
      assert.deepEqual(allUaiFound, allUaiSeed);
    });

    it("returns all cfas in a departement when etablissement_num_departement criteria passed", async () => {
      const cfasFound = await searchCfas({ etablissement_num_departement: "80" });

      assert.equal(cfasFound.length, 2);
      const allUaiFound = cfasFound.map((cfa) => cfa.uai);
      const expectedUai = [cfaSeed[3].uai, cfaSeed[0].uai];
      assert.deepEqual(allUaiFound, expectedUai);
    });

    it("returns all cfas in a region when etablissement_num_region criteria passed", async () => {
      const cfasFound = await searchCfas({ etablissement_num_region: "03" });

      assert.equal(cfasFound.length, 1);
      assert.equal(cfasFound[0].uai, cfaSeed[2].uai);
    });

    it("return all cfas in a reseau when etablissement_reseaux criteria passed", async () => {
      const cfasFound = await searchCfas({ etablissement_reseaux: "AFTRAL" });

      assert.equal(cfasFound.length, 3);
      const allUaiFound = cfasFound.map((cfa) => cfa.uai);
      const expectedUai = [cfaSeed[2].uai, cfaSeed[1].uai, cfaSeed[0].uai];
      assert.deepEqual(allUaiFound, expectedUai);
    });

    it("return all cfas in a reseau and departement when etablissement_reseaux and etablissement_num_departement criteria passed", async () => {
      const cfasFound = await searchCfas({ etablissement_reseaux: "AFTRAL", etablissement_num_departement: "80" });

      assert.equal(cfasFound.length, 1);
      assert.equal(cfasFound[0].uai, cfaSeed[0].uai);
    });

    describe("with search term", () => {
      const validsearchTermCases = [
        {
          caseDescription: "when searchTerm matches several nom partially => AFTRAL",
          searchTerm: "AFTRAL",
          expectedResults: [cfaSeed[0], cfaSeed[1], cfaSeed[2]],
        },
        {
          caseDescription: "when searchTerm matches several nom but with different case (aftral)",
          searchTerm: "aftral",
          expectedResults: [cfaSeed[0], cfaSeed[1], cfaSeed[2]],
        },
        {
          caseDescription: "when searchTerm matches one nom (BTP CFA Somme)",
          searchTerm: "BTP CFA Somme",
          expectedResults: [cfaSeed[3]],
        },
        {
          caseDescription: "when searchTerm matches one nom but partially (BTP Somme)",
          searchTerm: "BTP Somme",
          expectedResults: [cfaSeed[3]],
        },
        {
          caseDescription: "when searchTerm matches a word in nom but with different diacritics and case (btp sômme)",
          searchTerm: "btp sômme",
          expectedResults: [cfaSeed[3]],
        },
      ];
      validsearchTermCases.forEach(({ searchTerm, caseDescription, expectedResults }) => {
        it(`returns list of CFA matching ${caseDescription}`, async () => {
          const actualResults = await searchCfas({ searchTerm });
          assert.equal(actualResults.length, expectedResults.length);
          expectedResults.forEach((result) => {
            const foundResult = actualResults.find((cfa) => cfa.uai_etablissement === result.uai_etablissement);
            assert.ok(foundResult);
          });
        });
      });

      it("returns list of CFA whose UAI matches searchTerm", async () => {
        const actual = await searchCfas({ searchTerm: cfaSeed[2].uai });
        const expected = [cfaSeed[2]];
        assert.equal(actual.length, 1);
        assert.deepEqual(actual[0].nom, expected[0].nom);
      });

      it("returns list of CFA matching searchTerm AND additional criteria (etablissement_num_departement)", async () => {
        const actual = await searchCfas({ searchTerm: "AFTRAL", etablissement_num_departement: "80" });
        const expected = [cfaSeed[0]];
        assert.equal(actual.length, 1);
        assert.deepEqual(actual[0].nom, expected[0].nom);
      });

      it("returns list of CFA matching searchTerm AND additional filter (etablissement_num_region)", async () => {
        const actual = await searchCfas({ searchTerm: "AFTRAL", etablissement_num_region: "03" });
        const expected = [cfaSeed[2]];
        assert.equal(actual.length, 1);
        assert.deepEqual(actual[0].nom, expected[0].nom);
      });

      it("returns list of CFA matching searchTerm AND additional filter (etablissement_reseaux)", async () => {
        const actual = await searchCfas({ searchTerm: "somme", etablissement_reseaux: "BTP" });
        const expected = [cfaSeed[3]];
        assert.equal(actual.length, 1);
        assert.deepEqual(actual[0].nom, expected[0].nom);
      });
    });
  });

  describe("getCfaFirstTransmissionDateFromUai", () => {
    const { getCfaFirstTransmissionDateFromUai } = cfasComponent();
    const uaiToSearch = "0762290X";
    const firstDate = new Date("2020-08-30T00:00:00.000+0000");
    const statutsSeed = [
      {
        ...createRandomStatutCandidat(),
        uai_etablissement: uaiToSearch,
        created_at: addDays(firstDate, 2),
      },
      {
        ...createRandomStatutCandidat(),
        uai_etablissement: uaiToSearch,
        created_at: firstDate,
      },
      {
        ...createRandomStatutCandidat(),
        uai_etablissement: uaiToSearch,
        created_at: addDays(firstDate, 3),
      },
      {
        ...createRandomStatutCandidat(),
        uai_etablissement: uaiToSearch,
        created_at: addDays(firstDate, 4),
      },
    ];

    beforeEach(async () => {
      for (let i = 0; i < statutsSeed.length; i++) {
        const statut = statutsSeed[i];
        await new StatutCandidatModel(statut).save();
      }
    });

    it("returns null when no parameter passed", async () => {
      const firstTransmissionDateFromNoUaiParameter = await getCfaFirstTransmissionDateFromUai();
      assert.deepEqual(firstTransmissionDateFromNoUaiParameter, null);
    });

    it("returns null when bad uai is passed", async () => {
      const firstTransmissionDateFromBadUai = await getCfaFirstTransmissionDateFromUai("00000000");
      assert.deepEqual(firstTransmissionDateFromBadUai, null);
    });

    it("returns first date when good uai is passed", async () => {
      const firstTransmissionDateFromGoodUai = await getCfaFirstTransmissionDateFromUai(uaiToSearch);
      assert.deepEqual(firstTransmissionDateFromGoodUai, firstDate);
    });
  });

  describe("getCfaFirstTransmissionDateFromSiret", () => {
    const { getCfaFirstTransmissionDateFromSiret } = cfasComponent();

    const siretToSearch = "80420010000024";
    const firstDate = new Date("2020-06-10T00:00:00.000+0000");
    const statutsSeed = [
      {
        ...createRandomStatutCandidat(),
        siret_etablissement: siretToSearch,
        created_at: addDays(firstDate, 2),
      },
      {
        ...createRandomStatutCandidat(),
        siret_etablissement: siretToSearch,
        created_at: addDays(firstDate, 3),
      },
      {
        ...createRandomStatutCandidat(),
        siret_etablissement: siretToSearch,
        created_at: firstDate,
      },
      {
        ...createRandomStatutCandidat(),
        siret_etablissement: siretToSearch,
        created_at: addDays(firstDate, 4),
      },
    ];

    beforeEach(async () => {
      for (let i = 0; i < statutsSeed.length; i++) {
        const statut = statutsSeed[i];
        await new StatutCandidatModel(statut).save();
      }
    });

    it("returns null when no parameter passed", async () => {
      const firstTransmissionDateFromNoSiretParameter = await getCfaFirstTransmissionDateFromSiret();
      assert.deepEqual(firstTransmissionDateFromNoSiretParameter, null);
    });

    it("returns null when bad siret is passed", async () => {
      const firstTransmissionDateFromBadSiret = await getCfaFirstTransmissionDateFromSiret("00000000000000");
      assert.deepEqual(firstTransmissionDateFromBadSiret, null);
    });

    it("returns first date when good siret is passed", async () => {
      const getCfaFirstTransmissionDateFromGoodSiret = await getCfaFirstTransmissionDateFromSiret(siretToSearch);
      assert.deepEqual(getCfaFirstTransmissionDateFromGoodSiret, firstDate);
    });
  });
  describe("getFromAccessToken", () => {
    const { getFromAccessToken } = cfasComponent();

    it("returns Cfa found with access token", async () => {
      const token = "token";
      const cfaInDb = await new CfaModel({
        uai: "0762290X",
        sirets: [],
        nom: "hello",
        access_token: "token",
      }).save();
      const cfaFound = await getFromAccessToken(token);
      assert.equal(cfaFound.uai, cfaInDb.uai);
    });

    it("returns nothing when cfa not found", async () => {
      const token = "token";
      const cfaFound = await getFromAccessToken(token);
      assert.equal(cfaFound, null);
    });
  });
});
