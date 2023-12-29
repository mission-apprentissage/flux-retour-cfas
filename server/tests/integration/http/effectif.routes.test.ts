import { AxiosInstance } from "axiosist";
import { ObjectId } from "bson";

import { effectifsDb, organismesDb } from "@/common/model/collections";
import { historySequenceInscritToApprenti } from "@tests/data/historySequenceSamples";
import { createSampleEffectif } from "@tests/data/randomizedSample";
import { useMongo } from "@tests/jest/setupMongo";
import {
  PermissionsTestConfig,
  commonEffectifsAttributes,
  testPermissions,
  organismes,
} from "@tests/utils/permissions";
import { RequestAsOrganisationFunc, expectUnauthorizedError, initTestApp } from "@tests/utils/testUtils";

let httpClient: AxiosInstance;
let requestAsOrganisation: RequestAsOrganisationFunc;

describe("Routes diverses", () => {
  useMongo();
  beforeEach(async () => {
    const app = await initTestApp();
    httpClient = app.httpClient;
    requestAsOrganisation = app.requestAsOrganisation;
  });
  beforeEach(async () => {
    await organismesDb().insertMany(organismes);
  });

  describe("DELETE /api/v1/effectif - suppression d'effectif", () => {
    const anneeScolaire = "2022-2023";
    let effectifId: ObjectId;

    beforeEach(async () => {
      const { insertedId } = await effectifsDb().insertOne(
        createSampleEffectif({
          ...commonEffectifsAttributes,
          annee_scolaire: anneeScolaire,
          apprenant: {
            historique_statut: historySequenceInscritToApprenti,
          },
          organisme_id: organismes[0]._id,
        })
      );
      effectifId = insertedId;
    });

    it("Vérifie qu'on ne peut pas accéder à la route sans être authentifié", async () => {
      const response = await httpClient.delete(`/api/v1/effectif/${effectifId}`);
      expectUnauthorizedError(response);
    });

    describe("Vérifie selon les permissions si on peut supprimer un effectif", () => {
      const accesOrganisme: PermissionsTestConfig<boolean> = {
        "OF cible": true,
        "OF responsable": true,
        Administrateur: true,
        "OF non lié": false,
        "OF formateur": false,
        "Tête de réseau même réseau": false,
        "Tête de réseau Responsable": false,
        "Tête de réseau autre réseau": false,
        "DREETS même région": false,
        "DREETS autre région": false,
        "DRAAF même région": false,
        "DRAAF autre région": false,
        "Conseil Régional même région": false,
        "Conseil Régional autre région": false,
        "CARIF OREF régional même région": false,
        "CARIF OREF régional autre région": false,
        "DDETS même département": false,
        "DDETS autre département": false,
        "Académie même académie": false,
        "Académie autre académie": false,
        "Opérateur public national": false,
        "CARIF OREF national": false,
      };
      testPermissions(accesOrganisme, async (organisation, allowed) => {
        const response = await requestAsOrganisation(organisation, "delete", `/api/v1/effectif/${effectifId}`);
        expect(response.status).toStrictEqual(allowed ? 200 : 403);
        await expect(effectifsDb().countDocuments()).resolves.toStrictEqual(allowed ? 0 : 1);
      });
    });
  });
});
