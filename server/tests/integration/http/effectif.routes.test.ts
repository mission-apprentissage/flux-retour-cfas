import { AxiosInstance } from "axiosist";
import { ObjectId } from "bson";
import { getAnneesScolaireListFromDate } from "shared/utils";
import { it, expect, describe, beforeEach } from "vitest";

import { effectifsArchiveDb, effectifsDb, organismesDb, reseauxDb } from "@/common/model/collections";
import { historySequenceInscritToApprenti } from "@tests/data/historySequenceSamples";
import { createSampleEffectif } from "@tests/data/randomizedSample";
import { useMongo } from "@tests/jest/setupMongo";
import {
  PermissionsTestConfig,
  commonEffectifsAttributes,
  testPermissions,
  organismes,
  reseaux,
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
    await reseauxDb().insertMany(reseaux);
  });

  describe("DELETE /api/v1/effectif - suppression d'un doublon d'effectif", () => {
    const anneeScolaire = getAnneesScolaireListFromDate(new Date())[0];
    let effectifId: ObjectId;

    beforeEach(async () => {
      const effectif = await createSampleEffectif({
        ...commonEffectifsAttributes(),
        annee_scolaire: anneeScolaire,
        id_erp_apprenant: "ERP-1",
        apprenant: {
          nom: "DURAND",
          prenom: "Léa",
          date_de_naissance: new Date("2007-03-04T00:00:00Z"),
          historique_statut: historySequenceInscritToApprenti,
        },
        organisme_id: organismes[0]._id,
      });
      const { insertedId } = await effectifsDb().insertOne({ _id: new ObjectId(), ...effectif });
      await effectifsDb().insertOne({ ...effectif, _id: new ObjectId(), id_erp_apprenant: "hash-fichier" });
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
        "Tête de réseau Responsable": true,
        "Tête de réseau autre réseau": false,
        "DREETS même région": false,
        "DREETS autre région": false,
        "Conseil Régional même région": false,
        "Conseil Régional autre région": false,
        "DDETS même département": false,
        "DDETS autre département": false,
        "Académie même académie": false,
        "Académie autre académie": false,
        "Opérateur public national": false,
      };
      testPermissions(accesOrganisme, async (organisation, allowed) => {
        const response = await requestAsOrganisation(organisation, "delete", `/api/v1/effectif/${effectifId}`);
        expect(response.status).toStrictEqual(allowed ? 200 : 403);
        await expect(effectifsDb().countDocuments({ _id: effectifId })).resolves.toStrictEqual(allowed ? 0 : 1);
        await expect(effectifsArchiveDb().countDocuments()).resolves.toStrictEqual(allowed ? 1 : 0);
      });
    });
  });
  describe("DELETE /api/v1/organismes/:id/duplicates - suppression des doublons en lot", () => {
    beforeEach(async () => {
      const effectif = await createSampleEffectif({
        ...commonEffectifsAttributes(),
        annee_scolaire: getAnneesScolaireListFromDate(new Date())[0],
        id_erp_apprenant: "ERP-1",
        apprenant: {
          nom: "DURAND",
          prenom: "Léa",
          date_de_naissance: new Date("2007-03-04T00:00:00Z"),
          historique_statut: historySequenceInscritToApprenti,
        },
        organisme_id: organismes[0]._id,
      });
      await effectifsDb().insertMany([
        { ...effectif, _id: new ObjectId(), source: "ERP" },
        { ...effectif, _id: new ObjectId(), id_erp_apprenant: "hash-fichier", source: "FICHIER" },
      ]);
    });

    const accesOrganisme: PermissionsTestConfig<boolean> = {
      "OF cible": true,
      "OF responsable": true,
      Administrateur: true,
      "OF non lié": false,
      "OF formateur": false,
      "Tête de réseau même réseau": false,
      "Tête de réseau Responsable": true,
      "Tête de réseau autre réseau": false,
      "DREETS même région": false,
      "DREETS autre région": false,
      "Conseil Régional même région": false,
      "Conseil Régional autre région": false,
      "DDETS même département": false,
      "DDETS autre département": false,
      "Académie même académie": false,
      "Académie autre académie": false,
      "Opérateur public national": false,
    };
    testPermissions(accesOrganisme, async (organisation, allowed) => {
      const response = await requestAsOrganisation(
        organisation,
        "delete",
        `/api/v1/organismes/${organismes[0]._id}/duplicates`
      );
      expect(response.status).toStrictEqual(allowed ? 200 : 403);
      if (allowed) {
        expect(response.data).toStrictEqual({ supprimes: 1, refuses: 0 });
      }
      await expect(effectifsDb().countDocuments({ organisme_id: organismes[0]._id })).resolves.toStrictEqual(
        allowed ? 1 : 2
      );
      await expect(effectifsArchiveDb().countDocuments({ id_erp_apprenant: "hash-fichier" })).resolves.toStrictEqual(
        allowed ? 1 : 0
      );
    });
  });
});
