const assert = require("assert").strict;
const integrationTests = require("../../../utils/integrationTests");
const cfasComponent = require("../../../../src/common/components/cfas");
const { StatutCandidat: StatutCandidatModel } = require("../../../../src/common/model");
const { createRandomStatutCandidat } = require("../../../data/randomizedSample");
const { buildTokenizedString } = require("../../../../src/common/utils/buildTokenizedString");
const { addDays } = require("date-fns");

integrationTests(__filename, () => {
  describe("searchCfas", () => {
    const { searchCfas } = cfasComponent();

    const statutsSeed = [
      {
        ...createRandomStatutCandidat(),
        nom_etablissement: "CFA DU ROANNAIS",
        etablissement_num_departement: "15",
        etablissement_num_region: "01",
        uai_etablissement: "0152290X",
        uai_etablissement_valid: true,
        etablissement_reseaux: "RESEAU_TEST",
      },
      {
        ...createRandomStatutCandidat(),
        nom_etablissement: "cFa dU RO",
        etablissement_num_departement: "15",
        etablissement_num_region: "01",
        uai_etablissement: "0152232N",
        uai_etablissement_valid: true,
        etablissement_reseaux: "RESEAU_TEST",
      },
      {
        ...createRandomStatutCandidat(),
        nom_etablissement: "cfa du roanna",
        etablissement_num_departement: "39",
        etablissement_num_region: "123",
        uai_etablissement: "0392232X",
        uai_etablissement_valid: true,
        etablissement_reseaux: "RESEAU_TEST",
      },
      {
        ...createRandomStatutCandidat(),
        nom_etablissement: "CFA DUROC",
        etablissement_num_departement: "75",
        etablissement_num_region: "02",
        uai_etablissement: "0752232O",
        uai_etablissement_valid: true,
        etablissement_reseaux: "RESEAU_TEST",
      },
      {
        ...createRandomStatutCandidat(),
        nom_etablissement: "FACULTE SCIENCES NANCY",
        etablissement_num_departement: "15",
        etablissement_num_region: "039",
        uai_etablissement: "0152232Z",
        uai_etablissement_valid: true,
        etablissement_reseaux: "RESEAU_TEST",
      },
    ];

    beforeEach(async () => {
      for (let i = 0; i < statutsSeed.length; i++) {
        const statut = statutsSeed[i];
        await new StatutCandidatModel({
          ...statut,
          nom_etablissement_tokenized: buildTokenizedString(statut.nom_etablissement, 3),
        }).save();
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

    const validsearchTermCases = [
      {
        caseDescription: "when searchTerm matches nom_etablissement perfectly",
        searchTerm: statutsSeed[4].nom_etablissement,
        expectedResults: [statutsSeed[4]],
      },
      {
        caseDescription: "when searchTerm matches nom_etablissement perfectly but with different case",
        searchTerm: statutsSeed[4].nom_etablissement.toLowerCase(),
        expectedResults: [statutsSeed[4]],
      },
      {
        caseDescription: "when searchTerm matches nom_etablissement partially",
        searchTerm: statutsSeed[4].nom_etablissement.slice(0, 6),
        expectedResults: [statutsSeed[4]],
      },
      {
        caseDescription: "when searchTerm matches a word in nom_etablissement",
        searchTerm: "SCIENCES",
        expectedResults: [statutsSeed[4]],
      },
      {
        caseDescription: "when searchTerm matches a word with different case in nom_etablissement",
        searchTerm: "cfa du",
        expectedResults: [statutsSeed[0], statutsSeed[1], statutsSeed[2], statutsSeed[3]],
      },
      {
        caseDescription: "when searchTerm matches a word with different diacritics in nom_etablissement",
        searchTerm: "CFà",
        expectedResults: [statutsSeed[0], statutsSeed[1], statutsSeed[2], statutsSeed[3]],
      },
      {
        caseDescription: "when searchTerm matches a word in nom_etablissement close to others",
        searchTerm: "CFA DUROC",
        expectedResults: [statutsSeed[0], statutsSeed[1], statutsSeed[2], statutsSeed[3]],
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
      const actual = await searchCfas({ searchTerm: statutsSeed[1].uai_etablissement });
      const expected = [statutsSeed[1]];

      assert.equal(actual.length, 1);
      assert.deepEqual(actual[0].nom_etablissement, expected[0].nom_etablissement);
    });

    it("returns list of CFA matching searchTerm AND additional filter (etablissement_num_departement)", async () => {
      const actual = await searchCfas({ searchTerm: "CFA", etablissement_num_departement: "75" });
      const expected = [statutsSeed[3]];

      assert.equal(actual.length, 1);
      assert.deepEqual(actual[0].nom_etablissement, expected[0].nom_etablissement);
    });

    it("returns list of CFA matching searchTerm AND additional filter (etablissement_num_region)", async () => {
      const actual = await searchCfas({ searchTerm: "CFA", etablissement_num_region: "123" });
      const expected = [statutsSeed[2]];

      assert.equal(actual.length, 1);
      assert.deepEqual(actual[0].nom_etablissement, expected[0].nom_etablissement);
    });

    it("returns list of CFA matching searchTerm AND additional filter (etablissement_reseaux)", async () => {
      const actual = await searchCfas({ searchTerm: "FACULTE", etablissement_reseaux: "RESEAU_TEST" });
      const expected = [statutsSeed[4]];

      assert.equal(actual.length, 1);
      assert.deepEqual(actual[0].nom_etablissement, expected[0].nom_etablissement);
    });

    it("returns list of CFA matching a given search criteria (no searchTerm)", async () => {
      const actual = await searchCfas({ etablissement_num_region: "02" });
      const expected = [statutsSeed[3]];

      assert.equal(actual.length, 1);
      assert.deepEqual(actual[0].nom_etablissement, expected[0].nom_etablissement);
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
});
