import { strict as assert } from "assert";
// import { pick } from "lodash-es";
// import { createOrganisme, findOrganismeById } from "../../../src/common/actions/organismes/organismes.actions.js";
import config from "../../../src/config.js";
// import { createRandomOrganisme } from "../../data/randomizedSample.js";
import { startServer } from "../../utils/testUtils.js";

describe("Routes Organismes", () => {
  it("Vérifie que la route /organismes renvoie une 401 si aucune apiKey n'est fournie", async () => {
    const { httpClient } = await startServer();
    const response = await httpClient.post("/api/organismes");
    assert.strictEqual(response.status, 401);
  });

  it("Vérifie que la route /organismes renvoie une 401 si une mauvaise apiKey est fournie", async () => {
    const { httpClient } = await startServer();
    const response = await httpClient.post("/api/organismes", { apiKey: "BAD_API_KEY" });
    assert.strictEqual(response.status, 401);
  });

  it("Vérifie que la route /organismes renvoie une 200 avec des données si une bonne apiKey est fournie", async () => {
    const { httpClient } = await startServer();
    const response = await httpClient.post("/api/organismes", { apiKey: config.organismesConsultationApiKey });
    assert.strictEqual(response.status, 200);

    // TODO Tester la création d'un organisme + nock des API Entreprise & Catalog
    // const randomOrganisme = createRandomOrganisme();
    // const { _id } = await createOrganisme(randomOrganisme, {
    //   buildFormationTree: false,
    //   buildInfosFromSiret: false,
    //   callLbaApi: false,
    // });
    // const created = await findOrganismeById(_id);

    // const expected = pick(created, [
    //   "uai",
    //   "siret",
    //   "nom",
    //   "nature",
    //   "nature_validity_warning",
    //   "reseaux",
    //   "adresse",
    //   "metiers",
    //   "est_dans_le_referentiel",
    //   "ferme",
    // ]);

    // assert.strictEqual(response.data.organismes.length, 1);
    // assert.strictEqual(response.data.organismes, expected);
    // assert.strictEqual(response.data.pagination.nombre_de_page, 1);
    // assert.strictEqual(response.data.pagination.page, 1);
    // assert.strictEqual(response.data.pagination.resultats_par_page, 100);
    // assert.strictEqual(response.data.pagination.total, 1);
  });
});
