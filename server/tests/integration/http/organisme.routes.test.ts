import { strict as assert } from "assert";

import {
  stringifyMongoFields,
  expectForbiddenError,
  expectUnauthorizedError,
  id,
  initTestApp,
  RequestAsOrganisationFunc,
  generate,
} from "../../utils/testUtils.js";
import { AxiosInstance } from "axiosist";
import { effectifsDb, organismesDb } from "../../../src/common/model/collections.js";
import { PermissionsTestConfig, organismes, testPermissions } from "../../utils/permissions.js";
import { beforeEach } from "mocha";
import {
  historySequenceApprenti,
  historySequenceInscritToApprenti,
  historySequenceInscritToApprentiToAbandon,
} from "../../data/historySequenceSamples.js";
import { createSampleEffectif } from "../../data/randomizedSample.js";
import { Effectif } from "../../../src/common/model/@types/Effectif.js";

const userOrganisme = organismes[0];

const commonEffectifsAttributes: Pick<{ [key in keyof Effectif]: Effectif[key] }, "organisme_id" | "_computed"> = {
  organisme_id: userOrganisme._id,
  _computed: {
    organisme: {
      region: userOrganisme.adresse!.region!, // eslint-disable-line @typescript-eslint/no-non-null-assertion -- mauvais typage TS
      departement: userOrganisme.adresse!.departement!, // eslint-disable-line @typescript-eslint/no-non-null-assertion
      academie: userOrganisme.adresse!.academie!, // eslint-disable-line @typescript-eslint/no-non-null-assertion
      reseaux: userOrganisme.reseaux!, // eslint-disable-line @typescript-eslint/no-non-null-assertion
      uai: userOrganisme.uai as string,
      siret: userOrganisme.siret,
    },
  },
};

let app: Awaited<ReturnType<typeof initTestApp>>;
let httpClient: AxiosInstance;
let requestAsOrganisation: RequestAsOrganisationFunc;

describe("Routes /organismes/:id", () => {
  before(async () => {
    app = await initTestApp();
    httpClient = app.httpClient;
    requestAsOrganisation = app.requestAsOrganisation;
  });
  beforeEach(async () => {
    await organismesDb().insertMany(organismes);
  });

  const accesOrganisme: PermissionsTestConfig = {
    "OFF lié": true,
    "OFF non lié": false,
    "OFR lié": true,
    "OFR responsable": true,
    "OFR non lié": false,
    "OFRF lié": true,
    "OFRF responsable": true,
    "OFRF non lié": false,
    "Tête de réseau": true,
    "Tête de réseau non liée": false,
    "DREETS même région": true,
    "DREETS autre région": false,
    "DDETS même département": true,
    "DDETS autre département": false,
    "ACADEMIE même académie": true,
    "ACADEMIE autre académie": false,
    "Opérateur public national": true,
    Administrateur: true,
  };
  describe("GET /organismes/:id - détail d'un organisme", () => {
    it("Erreur si non authentifié", async () => {
      const response = await httpClient.get(`/api/v1/organisme/${id(1)}`);

      expectUnauthorizedError(response);
    });

    describe("Permissions", () => {
      testPermissions(accesOrganisme, async (organisation, allowed) => {
        const response = await requestAsOrganisation(organisation, "get", `/api/v1/organismes/${id(1)}`);

        if (allowed) {
          assert.strictEqual(response.status, 200);
          assert.deepStrictEqual(response.data, stringifyMongoFields(userOrganisme));
        } else {
          expectForbiddenError(response);
        }
      });
    });
  });

  describe("GET /organismes/:id/indicateurs - indicateurs d'un organisme", () => {
    const date = "2023-04-13T10:00:00.000Z";
    const anneeScolaire = "2022-2023";

    it("Erreur si non authentifié", async () => {
      const response = await httpClient.get(`/api/v1/organisme/${id(1)}/indicateurs?date=${date}`);

      expectUnauthorizedError(response);
    });

    describe("Permissions", () => {
      beforeEach(async () => {
        // FIXME revoir les statuts
        await effectifsDb().insertMany([
          // 10 inscritToApprentiToAbandon
          ...generate(10, () =>
            createSampleEffectif({
              ...commonEffectifsAttributes,
              annee_scolaire: anneeScolaire,
              apprenant: {
                historique_statut: historySequenceInscritToApprentiToAbandon,
              },
            })
          ),
          // 5 apprenti
          ...generate(5, () =>
            createSampleEffectif({
              ...commonEffectifsAttributes,
              annee_scolaire: anneeScolaire,
              apprenant: {
                historique_statut: historySequenceApprenti,
              },
            })
          ),

          // 15 inscritToApprenti
          ...generate(15, () =>
            createSampleEffectif({
              ...commonEffectifsAttributes,
              annee_scolaire: anneeScolaire,
              apprenant: {
                historique_statut: historySequenceInscritToApprenti,
              },
            })
          ),
        ]);
      });
      testPermissions(accesOrganisme, async (organisation, allowed) => {
        const response = await requestAsOrganisation(
          organisation,
          "get",
          `/api/v1/organismes/${id(1)}/indicateurs?date=${date}`
        );

        if (allowed) {
          assert.strictEqual(response.status, 200);
          assert.deepStrictEqual(response.data, {
            date: date,
            apprentis: 20,
            inscritsSansContrat: 0,
            rupturants: 0,
            abandons: 10,
            totalOrganismes: 0,
          });
        } else {
          expectForbiddenError(response);
        }
      });
    });
  });

  const configurationERP: PermissionsTestConfig = {
    "OFF lié": true,
    "OFF non lié": false,
    "OFR lié": true,
    "OFR responsable": true,
    "OFR non lié": false,
    "OFRF lié": true,
    "OFRF responsable": true,
    "OFRF non lié": false,
    "Tête de réseau": false,
    "Tête de réseau non liée": false,
    "DREETS même région": false,
    "DREETS autre région": false,
    "DDETS même département": false,
    "DDETS autre département": false,
    "ACADEMIE même académie": false,
    "ACADEMIE autre académie": false,
    "Opérateur public national": false,
    Administrateur: true,
  };
  describe("PUT /organismes/:id/configure-erp - configuration de l'ERP d'un organisme", () => {
    it("Erreur si non authentifié", async () => {
      const response = await httpClient.put(`/api/v1/organismes/${id(1)}/configure-erp`, {
        mode_de_transmission: "MANUEL",
        setup_step_courante: "COMPLETE",
      });

      expectUnauthorizedError(response);
    });

    describe("Permissions", () => {
      testPermissions(configurationERP, async (organisation, allowed) => {
        const response = await requestAsOrganisation(organisation, "put", `/api/v1/organismes/${id(1)}/configure-erp`, {
          mode_de_transmission: "MANUEL",
          setup_step_courante: "COMPLETE",
        });

        if (allowed) {
          assert.strictEqual(response.status, 200);
          assert.deepStrictEqual(response.data, {
            message: "success",
          });
        } else {
          expectForbiddenError(response);
        }
      });
    });
  });
});
