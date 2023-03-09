import { strict as assert } from "assert";
// import { pick } from "lodash-es";
// import { createOrganisme, findOrganismeById } from "../../../src/common/actions/organismes/organismes.actions";
import config from "../../../src/config";
// import { createRandomOrganisme } from "../../data/randomizedSample";
import { startServer } from "../../utils/testUtils";

describe("Routes Organismes", () => {
  it("Vérifie que la route /organismes renvoie une 401 si aucune apiKey n'est fournie", async () => {
    const apiKeyValue = process.env.FLUX_RETOUR_CFAS_ORGANISMES_CONSULTATION_API_KEY;
    console.log(apiKeyValue);
    const { httpClient } = await startServer();
    const response = await httpClient.post("/api/organismes");
    assert.deepEqual(response.status, 401);
  });

  it("Vérifie que la route /organismes renvoie une 401 si une mauvaise apiKey est fournie", async () => {
    const { httpClient } = await startServer();
    const response = await httpClient.post("/api/organismes", { apiKey: "BAD_API_KEY" });
    assert.deepEqual(response.status, 401);
  });

  it("Vérifie que la route /organismes renvoie une 200 avec des données si une bonne apiKey est fournie", async () => {
    const { httpClient } = await startServer();
    const response = await httpClient.post("/api/organismes", { apiKey: config.organismesConsultationApiKey });
    assert.deepEqual(response.status, 200);

    // TODO Tester la création d'un organisme + nock des API Entreprise & Catalog
    // const randomOrganisme = createRandomOrganisme();
    // const { _id } = await createOrganisme(randomOrganisme);
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

    // assert.deepEqual(response.data.organismes.length, 1);
    // assert.deepEqual(response.data.organismes, expected);
    // assert.deepEqual(response.data.pagination.nombre_de_page, 1);
    // assert.deepEqual(response.data.pagination.page, 1);
    // assert.deepEqual(response.data.pagination.resultats_par_page, 100);
    // assert.deepEqual(response.data.pagination.total, 1);
  });
});
