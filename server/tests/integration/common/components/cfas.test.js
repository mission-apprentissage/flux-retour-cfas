const assert = require("assert").strict;
const integrationTests = require("../../../utils/integrationTests");
const cfasComponent = require("../../../../src/common/components/cfas");
const { StatutCandidat: StatutCandidatModel } = require("../../../../src/common/model");
const { createRandomStatutCandidat } = require("../../../data/randomizedSample");
const { buildTokenizedString } = require("../../../../src/common/utils/buildTokenizedString");

integrationTests(__filename, () => {
  describe("searchCfasByNomEtablissement", () => {
    const { searchCfasByNomEtablissement } = cfasComponent();

    const statutsSeed = [
      {
        ...createRandomStatutCandidat(),
        nom_etablissement: "CFA DU ROANNAIS",
        etablissement_num_departement: "15",
        siret_etablissement: "80420010000021",
        siret_etablissement_valid: true,
      },
      {
        ...createRandomStatutCandidat(),
        nom_etablissement: "cFa dU RO",
        etablissement_num_departement: "15",
        siret_etablissement: "80420010000022",
        siret_etablissement_valid: true,
      },
      {
        ...createRandomStatutCandidat(),
        nom_etablissement: "cfa du roanna",
        etablissement_num_departement: "15",
        siret_etablissement: "80420010000023",
        siret_etablissement_valid: true,
      },
      {
        ...createRandomStatutCandidat(),
        nom_etablissement: "CFA DUROC",
        etablissement_num_departement: "15",
        siret_etablissement: "80420010000024",
        siret_etablissement_valid: true,
      },
      {
        ...createRandomStatutCandidat(),
        nom_etablissement: "FACULTE SCIENCES NANCY",
        etablissement_num_departement: "15",
        siret_etablissement: "80420010000025",
        siret_etablissement_valid: true,
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
        await searchCfasByNomEtablissement();
      } catch (err) {
        assert.ok(err);
      }
    });

    it("returns [] when no CFA found", async () => {
      const cfa = await searchCfasByNomEtablissement("blabla");
      assert.deepEqual(cfa, []);
    });

    const validCases = [
      {
        caseDescription: "when searchTerm matches nom_etablissement perfectly",
        searchTerm: statutsSeed[4].nom_etablissement,
        expectedResult: [statutsSeed[4]],
      },
      {
        caseDescription: "when searchTerm matches nom_etablissement perfectly but with different case",
        searchTerm: statutsSeed[4].nom_etablissement.toLowerCase(),
        expectedResult: [statutsSeed[4]],
      },
      {
        caseDescription: "when searchTerm matches nom_etablissement partially",
        searchTerm: statutsSeed[4].nom_etablissement.slice(0, 6),
        expectedResult: [statutsSeed[4]],
      },
      {
        caseDescription: "when searchTerm matches a word in nom_etablissement",
        searchTerm: "SCIENCES",
        expectedResult: [statutsSeed[4]],
      },
      {
        caseDescription: "when searchTerm matches a word with different case in nom_etablissement",
        searchTerm: "cfa du",
        expectedResult: [statutsSeed[0], statutsSeed[1], statutsSeed[2], statutsSeed[3]],
      },
      {
        caseDescription: "when searchTerm matches a word with different diacritics in nom_etablissement",
        searchTerm: "CFà",
        expectedResult: [statutsSeed[0], statutsSeed[1], statutsSeed[2], statutsSeed[3]],
      },
      {
        caseDescription: "when searchTerm matches a word in nom_etablissement close to others",
        searchTerm: "CFA DUROC",
        expectedResult: [statutsSeed[0], statutsSeed[1], statutsSeed[2], statutsSeed[3]],
      },
    ];

    validCases.forEach(({ searchTerm, caseDescription, expectedResult }) => {
      it(`returns list of CFA matching search ${caseDescription}`, async () => {
        const searchResults = await searchCfasByNomEtablissement(searchTerm);

        // we will sort results because we don't care of the order in the test
        const sortBySiret = (a, b) => Number(a.siret_etablissement) - Number(b.siret_etablissement);
        const actual = searchResults.sort(sortBySiret);
        const expected = expectedResult
          .map(({ nom_etablissement, siret_etablissement, etablissement_num_departement }) => ({
            nom_etablissement,
            siret_etablissement,
            etablissement_num_departement,
          }))
          .sort(sortBySiret);

        assert.deepEqual(actual, expected);
      });
    });
  });
});
