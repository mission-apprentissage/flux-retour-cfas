const assert = require("assert").strict;
const httpTests = require("../../utils/httpTests");
const { administrator } = require("../../../src/common/roles");
const { asyncForEach } = require("../../../src/common/utils/asyncUtils");
const { Formation: FormationModel } = require("../../../src/common/model");
const { Formation } = require("../../../src/common/domain/formation");

httpTests(__filename, ({ startServer }) => {
  const formationsSeed = [
    { cfd: "01022103", libelle: "EMPLOYE TRAITEUR (CAP)" },
    { cfd: "01023288", libelle: "ZINGUERIE (MC NIVEAU V)" },
    { cfd: "01022999", libelle: "Peinture décoration extérieure (MC NIVEAU V)" },
    { cfd: "01022111", libelle: "PEINTURE DECORATION (MC NIVEAU IV)" },
    { cfd: "01022551", libelle: "PEINTURE dEcOrAtIoN (MC NIVEAU IV)" },
    { cfd: "01026651", libelle: "PEINTURE DECORÀTION (MC NIVEAU IV)" },
  ];

  const seedFormations = async () => {
    await asyncForEach(formationsSeed, async (formationSeed) => {
      const formation = Formation.create(formationSeed);
      await new FormationModel(formation).save();
    });
  };

  let httpClient, bearerToken;

  beforeEach(async () => {
    const { httpClient: _httpClient, createAndLogUser } = await startServer();
    httpClient = _httpClient;
    bearerToken = await createAndLogUser("user", "password", { permissions: [administrator] });

    await seedFormations();
  });

  it("sends a 401 HTTP response when no authorization header passed", async () => {
    const response = await httpClient.post("/api/formations/search");

    assert.equal(response.status, 401);
  });

  it("sends a 400 HTTP response when no searchTerm provided", async () => {
    const response = await httpClient.post(
      "/api/formations/search",
      {},
      {
        headers: bearerToken,
      }
    );

    assert.equal(response.status, 400);
    assert.equal(response.data.message, "query parameter 'searchTerm' is required");
  });

  it("sends a 400 HTTP response when searchTerm is shorter than 3 chars", async () => {
    const searchTerm = "he";

    const response = await httpClient.post(
      `/api/formations/search?searchTerm=${searchTerm}`,
      {},
      {
        headers: bearerToken,
      }
    );

    assert.equal(response.status, 400);
  });

  const validCases = [
    {
      caseDescription: "when searchTerm matches cfd perfectly",
      searchTerm: formationsSeed[0].cfd,
      expectedResult: [formationsSeed[0]],
    },
    {
      caseDescription: "when searchTerm matches cfd partially",
      searchTerm: formationsSeed[0].cfd.slice(0, 6),
      expectedResult: [formationsSeed[0], formationsSeed[3]],
    },
    {
      caseDescription: "when searchTerm matches libelle perfectly",
      searchTerm: formationsSeed[0].libelle,
      expectedResult: [formationsSeed[0]],
    },
    {
      caseDescription: "when searchTerm matches libelle partially",
      searchTerm: formationsSeed[0].libelle.slice(0, 5),
      expectedResult: [formationsSeed[0]],
    },
    {
      caseDescription: "when searchTerm matches a word in libelle",
      searchTerm: "ZINGUERIE",
      expectedResult: [formationsSeed[1]],
    },
    {
      caseDescription: "when searchTerm matches a word partially in libelle",
      searchTerm: "ZINGU",
      expectedResult: [formationsSeed[1]],
    },
    {
      caseDescription: "when searchTerm matches a word with different case in libelle",
      searchTerm: "zingu",
      expectedResult: [formationsSeed[1]],
    },
    {
      caseDescription: "when searchTerm matches a word with different diacritics in libelle",
      searchTerm: "zingùéri",
      expectedResult: [formationsSeed[1]],
    },
  ];

  validCases.forEach(({ searchTerm, caseDescription, expectedResult }) => {
    it(`sends a 200 HTTP response with results ${caseDescription}`, async () => {
      const response = await httpClient.post(
        `/api/formations/search?searchTerm=${encodeURIComponent(searchTerm)}`,
        {},
        {
          headers: bearerToken,
        }
      );

      assert.equal(response.status, 200);
      assert.deepEqual(response.data, expectedResult);
    });
  });

  it("sends a 200 HTTP response with results matching different cases and diacritics in libelle", async () => {
    const searchTerm = "decoratio";

    const response = await httpClient.post(
      `/api/formations/search?searchTerm=${encodeURIComponent(searchTerm)}`,
      {},
      {
        headers: bearerToken,
      }
    );

    assert.equal(response.status, 200);
    assert.equal(response.data.length, 4);
    assert.ok(response.data.find((formation) => formation.cfd === formationsSeed[2].cfd));
    assert.ok(response.data.find((formation) => formation.cfd === formationsSeed[3].cfd));
    assert.ok(response.data.find((formation) => formation.cfd === formationsSeed[4].cfd));
    assert.ok(response.data.find((formation) => formation.cfd === formationsSeed[5].cfd));
  });
});
