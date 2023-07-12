import { strict as assert } from "assert";

import { AxiosInstance } from "axiosist";

import { effectifsDb, organismesDb } from "@/common/model/collections";
import {
  historySequenceApprenti,
  historySequenceApprentiToAbandon,
  historySequenceApprentiToInscrit,
  historySequenceInscrit,
} from "@tests/data/historySequenceSamples";
import { createSampleEffectif } from "@tests/data/randomizedSample";
import {
  PermissionsTestConfig,
  commonEffectifsAttributes,
  organismes,
  testPermissions,
  userOrganisme,
} from "@tests/utils/permissions";
import {
  RequestAsOrganisationFunc,
  expectForbiddenError,
  expectUnauthorizedError,
  generate,
  id,
  initTestApp,
  stringifyMongoFields,
} from "@tests/utils/testUtils";

let app: Awaited<ReturnType<typeof initTestApp>>;
let httpClient: AxiosInstance;
let requestAsOrganisation: RequestAsOrganisationFunc;

describe("Routes /organismes/:id", () => {
  beforeEach(async () => {
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
    "OFRF lié": true,
    "OFRF responsable": true,
    "OFRF non lié": false,
    "OFR lié": true,
    "OFR responsable": true,
    "OFR non lié": false,
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
      const response = await httpClient.get(`/api/v1/organismes/${id(1)}`);

      expectUnauthorizedError(response);
    });

    describe("Permissions", () => {
      testPermissions(accesOrganisme, async (organisation, allowed) => {
        const response = await requestAsOrganisation(organisation, "get", `/api/v1/organismes/${id(1)}`);

        if (allowed) {
          expect(response.status).toStrictEqual(200);
          expect(response.data).toStrictEqual(stringifyMongoFields(userOrganisme));
        } else {
          expectForbiddenError(response);
        }
      });
    });
  });

  describe("GET /organismes/:id/indicateurs/effectifs - indicateurs effectifs d'un organisme", () => {
    const date = "2023-04-13T10:00:00.000Z";
    const anneeScolaire = "2022-2023";

    it("Erreur si non authentifié", async () => {
      const response = await httpClient.get(`/api/v1/organisme/${id(1)}/indicateurs/effectifs?date=${date}`);

      expectUnauthorizedError(response);
    });

    describe("Permissions", () => {
      beforeEach(async () => {
        // FIXME revoir les statuts
        await effectifsDb().insertMany([
          // 5 apprentis
          ...generate(5, () =>
            createSampleEffectif({
              ...commonEffectifsAttributes,
              annee_scolaire: anneeScolaire,
              apprenant: {
                historique_statut: historySequenceApprenti,
              },
            })
          ),

          // 10 Inscrit
          ...generate(10, () =>
            createSampleEffectif({
              ...commonEffectifsAttributes,
              annee_scolaire: anneeScolaire,
              apprenant: {
                historique_statut: historySequenceInscrit,
              },
            })
          ),

          // 15 ApprentiToAbandon
          ...generate(15, () =>
            createSampleEffectif({
              ...commonEffectifsAttributes,
              annee_scolaire: anneeScolaire,
              apprenant: {
                historique_statut: historySequenceApprentiToAbandon,
              },
            })
          ),

          // 20 ApprentiToInscrit
          ...generate(20, () =>
            createSampleEffectif({
              ...commonEffectifsAttributes,
              annee_scolaire: anneeScolaire,
              apprenant: {
                historique_statut: historySequenceApprentiToInscrit,
              },
            })
          ),
        ]);
      });
      testPermissions(accesOrganisme, async (organisation, allowed) => {
        const response = await requestAsOrganisation(
          organisation,
          "get",
          `/api/v1/organismes/${id(1)}/indicateurs/effectifs?date=${date}`
        );

        if (allowed) {
          expect(response.status).toStrictEqual(200);
          expect(response.data).toStrictEqual({
            apprenants: 35,
            apprentis: 5,
            inscritsSansContrat: 10,
            abandons: 15,
            rupturants: 20,
          });
        } else {
          expectForbiddenError(response);
        }
      });
    });
  });

  describe("GET /organismes/:id/indicateurs/organismes - indicateurs organismes d'un organisme", () => {
    it("Erreur si non authentifié", async () => {
      const response = await httpClient.get(`/api/v1/organisme/${id(3)}/indicateurs/organismes`);

      expectUnauthorizedError(response);
    });

    describe("Permissions", () => {
      // beforeEach(async () => {
      //   await organismesDb().insertMany([]);
      // });
      testPermissions(accesOrganisme, async (organisation, allowed) => {
        const response = await requestAsOrganisation(
          organisation,
          "get",
          `/api/v1/organismes/${id(1)}/indicateurs/organismes`
        );

        if (allowed) {
          expect(response.status).toStrictEqual(200);
          expect(response.data).toStrictEqual({
            tauxCouverture: 100,
            totalOrganismes: 1,
            organismesTransmetteurs: 1,
            organismesNonTransmetteurs: 0,
          });
        } else {
          expectForbiddenError(response);
        }
      });
    });

    it("agrégation OFRF", async () => {
      const response = await requestAsOrganisation(
        {
          type: "ORGANISME_FORMATION_RESPONSABLE_FORMATEUR",
          uai: "0000000B",
          siret: "00000000000026",
        },
        "get",
        `/api/v1/organismes/${id(2)}/indicateurs/organismes`
      );

      expect(response.status).toStrictEqual(200);
      expect(response.data).toStrictEqual({
        tauxCouverture: 100,
        totalOrganismes: 2,
        organismesTransmetteurs: 2,
        organismesNonTransmetteurs: 0,
      });
    });

    it("agrégation OFR", async () => {
      const response = await requestAsOrganisation(
        {
          type: "ORGANISME_FORMATION_RESPONSABLE",
          uai: "0000000C",
          siret: "00000000000034",
        },
        "get",
        `/api/v1/organismes/${id(3)}/indicateurs/organismes`
      );

      expect(response.status).toStrictEqual(200);
      expect(response.data).toStrictEqual({
        tauxCouverture: 100,
        totalOrganismes: 3,
        organismesTransmetteurs: 3,
        organismesNonTransmetteurs: 0,
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
