import { strict as assert } from "assert";
import { ObjectId } from "mongodb";

import { startServer, createAndAuthenticateUser } from "../../utils/testUtils.js";
import { createOrganisme } from "../../../src/common/actions/organismes/organismes.actions.js";

const ORGANISME_ENDPOINT = "/api/v1/organisme";

const organismes = [
  // owner
  {
    _id: new ObjectId("000000000000000000000001"),
    uai: "0142321X",
    siret: "41461021200014",
    adresse: {
      departement: "14",
      region: "28",
      academie: "70",
    },
    reseaux: ["CCI"],
    erps: ["YMAG"],
    nature: "responsable_formateur",
    nom: "ADEN Formations (Caen)",
    ferme: true,
  },
  // other
  {
    _id: new ObjectId("000000000000000000000002"),
    uai: "0142322X",
    siret: "77568013501089",
    adresse: {
      departement: "14",
      region: "28",
      academie: "70",
    },
    reseaux: ["CCI"],
    erps: ["YMAG"],
    nature: "responsable_formateur",
    nom: "ADEN Formations (Caen)",
  },
];

const userOrganisme = organismes[0];
const userOrganismeId = userOrganisme._id.toString();
let httpClient;
let apiClient;

describe("Organisme Route", () => {
  beforeEach(async () => {
    const app = await startServer();
    httpClient = app.httpClient;

    await Promise.all(
      organismes.map((organisme) =>
        createOrganisme(organisme, {
          buildFormationTree: false,
          buildInfosFromSiret: false,
          callLbaApi: false,
        })
      )
    );

    apiClient = await createAndAuthenticateUser(
      httpClient,
      {
        siret: "44492238900010",
        uai: userOrganisme.uai,
      },
      "organisme.admin"
    );
  });

  describe("GET /organisme", () => {
    it("Vérifie qu'on ne peut pas accéder à la route sans être authentifié", async () => {
      const response = await httpClient.get(`${ORGANISME_ENDPOINT}/entity/${userOrganismeId}`);

      assert.strictEqual(response.status, 401);
    });

    it("Vérifie qu'on peut accéder aux details son organisme", async () => {
      const response = await apiClient(
        "get",
        `${ORGANISME_ENDPOINT}/entity/${userOrganismeId}?organisme_id=${userOrganismeId}`
      );

      assert.strictEqual(response.status, 200);
      assert.deepStrictEqual(response.data, {
        ...userOrganisme,
        _id: userOrganismeId,
        ferme: true,
        fiabilisation_statut: "INCONNU",
        formations: [],
        metiers: [],
        acl: response.data.acl,
        created_at: response.data.created_at,
        updated_at: response.data.updated_at,
      });
    });

    it("Vérifie qu'on peut mettre à jour les details son organisme", async () => {
      const response = await apiClient(
        "put",
        `${ORGANISME_ENDPOINT}/entity/${userOrganismeId}?organisme_id=${userOrganismeId}`,
        {},
        {
          setup_step_courante: "STEP2",
          erps: ["ymag"],
          organisme_id: userOrganismeId,
        }
      );

      assert.strictEqual(response.status, 200);
      assert.deepStrictEqual(response.data, {
        ...userOrganisme,
        _id: userOrganismeId,
        erps: ["ymag"],
        setup_step_courante: "STEP2",
        fiabilisation_statut: "INCONNU",
        formations: [],
        metiers: [],
        acl: response.data.acl,
        created_at: response.data.created_at,
        updated_at: response.data.updated_at,
      });
    });
  });
});
