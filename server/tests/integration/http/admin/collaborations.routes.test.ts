import { AxiosInstance } from "axiosist";
import { ObjectId } from "mongodb";
import { NATURE_ORGANISME_DE_FORMATION } from "shared/constants";
import type { IOrganisation, IOrganisme } from "shared/models";
import { SITUATION_ENUM } from "shared/models/data/missionLocaleEffectif.model";
import { generateMissionLocaleEffectifFixture } from "shared/models/fixtures/missionLocaleEffectif.fixture";
import { generateOrganismeFixture } from "shared/models/fixtures/organisme.fixture";
import { getAnneeScolaireFromDate } from "shared/utils";
import { beforeEach, describe, expect, it } from "vitest";

import {
  effectifsDb,
  effectifsDECADb,
  missionLocaleEffectifsDb,
  missionLocaleEffectifsLogDb,
  organisationsDb,
  organismesDb,
} from "@/common/model/collections";
import { useMongo } from "@tests/jest/setupMongo";
import { RequestAsOrganisationFunc, expectUnauthorizedError, initTestApp } from "@tests/utils/testUtils";

useMongo();

const HDF = "32";
const HDF_NOM = "Hauts-de-France";
const CURRENT_ANNEE = getAnneeScolaireFromDate(new Date());

let httpClient: AxiosInstance;
let requestAsOrganisation: RequestAsOrganisationFunc;
let uaiCounter = 0;
const nextUai = () => `010001${(uaiCounter++).toString().padStart(2, "0")}A`;

async function insertCompatibleOrganisme(overrides: Partial<IOrganisme> = {}): Promise<IOrganisme> {
  const org = generateOrganismeFixture({
    _id: new ObjectId(),
    uai: nextUai(),
    nature: NATURE_ORGANISME_DE_FORMATION.FORMATEUR,
    ...overrides,
  });
  await organismesDb().insertOne(org, { bypassDocumentValidation: true });
  await effectifsDb().insertOne(
    { _id: new ObjectId(), organisme_id: org._id as ObjectId, annee_scolaire: CURRENT_ANNEE } as never,
    { bypassDocumentValidation: true }
  );
  return org;
}

const orgFormationFixture = (organismeId: ObjectId, activatedAt: Date | null): IOrganisation =>
  ({
    _id: new ObjectId(),
    type: "ORGANISME_FORMATION",
    created_at: new Date(),
    siret: "00000000000000",
    uai: null,
    organisme_id: organismeId.toString(),
    ...(activatedAt ? { ml_beta_activated_at: activatedAt } : {}),
  }) as IOrganisation;

const buildMlEffectif: typeof generateMissionLocaleEffectifFixture = (overrides) =>
  generateMissionLocaleEffectifFixture({ source: "ERP", ...overrides });

describe("admin collaborations routes", () => {
  beforeEach(async () => {
    const app = await initTestApp();
    httpClient = app.httpClient;
    requestAsOrganisation = app.requestAsOrganisation;
  });

  describe("GET /api/v1/admin/collaborations/stats", () => {
    it("rejects unauthenticated requests", async () => {
      const response = await httpClient.get("/api/v1/admin/collaborations/stats");
      expectUnauthorizedError(response);
    });

    it("forbids non-administrator organisations", async () => {
      const dreets = await requestAsOrganisation(
        { type: "DREETS", code_region: "32" },
        "get",
        "/api/v1/admin/collaborations/stats"
      );
      expect(dreets.status).toBe(403);

      const academie = await requestAsOrganisation(
        { type: "ACADEMIE", code_academie: "14" },
        "get",
        "/api/v1/admin/collaborations/stats"
      );
      expect(academie.status).toBe(403);
    });

    it("returns the stats payload for an administrator", async () => {
      const org = await insertCompatibleOrganisme({ adresse: { region: HDF } as never });
      await organisationsDb().insertOne(orgFormationFixture(org._id as ObjectId, new Date("2026-02-15")));

      await missionLocaleEffectifsDb().insertMany(
        [
          buildMlEffectif({
            mission_locale_id: new ObjectId(),
            organisme_id: org._id,
            created_at: new Date("2026-04-01"),
            reponse_at: new Date("2026-04-10"),
            acc_conjoint: true,
            situation: SITUATION_ENUM.RDV_PRIS,
          }),
        ],
        { bypassDocumentValidation: true }
      );

      const response = await requestAsOrganisation(
        { type: "ADMINISTRATEUR" },
        "get",
        "/api/v1/admin/collaborations/stats"
      );

      expect(response.status).toBe(200);
      expect(response.data).toMatchObject({
        cutoff_date: "2026-01-01T00:00:00.000Z",
        national: {
          activation: {
            cfa_compatibles: { current: 1, variation: "" },
            cfa_actives: { current: 1 },
            cfa_with_collab: { current: 1 },
          },
          usage: {
            rupturants: { current: 1 },
            dossiers_envoyes_cfa: { current: 1 },
            dossiers_traites_ml: { current: 1 },
            jeunes_repondus: { current: 1 },
            rdv_pris: { current: 1 },
          },
        },
      });
      expect(response.data.regions).toHaveLength(1);
      expect(response.data.regions[0]).toMatchObject({ region_code: HDF, cfa_compatibles: 1 });
    });
  });

  describe("GET /api/v1/admin/collaborations/export", () => {
    it("rejects unauthenticated requests", async () => {
      const response = await httpClient.get("/api/v1/admin/collaborations/export");
      expectUnauthorizedError(response);
    });

    it("returns the 4 export datasets for an administrator", async () => {
      const compatible = await insertCompatibleOrganisme({
        siret: "12345678900018",
        nom: "CFA Test",
        adresse: { region: HDF } as never,
      });
      await effectifsDECADb().insertOne(
        { _id: new ObjectId(), organisme_id: compatible._id as ObjectId, annee_scolaire: CURRENT_ANNEE } as never,
        { bypassDocumentValidation: true }
      );
      await insertCompatibleOrganisme({
        siret: "12345678900026",
        nom: "CFA Sans Envoi",
        adresse: { region: HDF } as never,
      });
      await organisationsDb().insertOne(orgFormationFixture(compatible._id as ObjectId, new Date("2026-03-01")));

      const mlId = new ObjectId();
      await organisationsDb().insertOne(
        {
          _id: mlId,
          type: "MISSION_LOCALE",
          nom: "ML Paris",
          created_at: new Date(),
        } as never,
        { bypassDocumentValidation: true }
      );

      await missionLocaleEffectifsDb().insertMany(
        [
          buildMlEffectif({
            mission_locale_id: mlId,
            organisme_id: compatible._id,
            created_at: new Date("2026-04-01"),
            reponse_at: new Date("2026-04-10"),
            acc_conjoint: true,
            situation: SITUATION_ENUM.RDV_PRIS,
            source: "ERP",
          }),
          buildMlEffectif({
            mission_locale_id: mlId,
            organisme_id: compatible._id,
            created_at: new Date("2026-04-20"),
            reponse_at: new Date("2026-04-22"),
            acc_conjoint: true,
            source: "DECA",
          }),
        ],
        { bypassDocumentValidation: true }
      );

      const response = await requestAsOrganisation(
        { type: "ADMINISTRATEUR" },
        "get",
        "/api/v1/admin/collaborations/export"
      );

      expect(response.status).toBe(200);
      expect(response.data.cfa_compatibles).toHaveLength(2);
      expect(response.data.cfa_actives).toEqual([
        {
          siret: "12345678900018",
          nom: "CFA Test",
          region: HDF_NOM,
          date_activation: "2026-03-01T00:00:00.000Z",
          sources: "ERP, DECA",
        },
      ]);
      expect(response.data.cfa_with_collab).toEqual([
        {
          siret: "12345678900018",
          nom: "CFA Test",
          region: HDF_NOM,
          nb_collaborations: 2,
        },
      ]);
      expect(response.data.details_collaborations).toHaveLength(2);
      expect(response.data.details_collaborations[0]).toMatchObject({
        siret_cfa: "12345678900018",
        nom_cfa: "CFA Test",
        region_cfa: HDF_NOM,
        nom_ml: "ML Paris",
        dossier_envoye: "Oui",
      });
    });

    it("populates date_traitement_ml from the earliest ML log entry with a situation", async () => {
      const org = await insertCompatibleOrganisme({
        siret: "12345678900034",
        nom: "CFA Log",
        adresse: { region: HDF } as never,
      });

      const mleId = new ObjectId();
      await missionLocaleEffectifsDb().insertOne(
        {
          ...buildMlEffectif({
            mission_locale_id: new ObjectId(),
            organisme_id: org._id,
            created_at: new Date("2026-03-01"),
            reponse_at: new Date("2026-03-02"),
            acc_conjoint: true,
            situation: SITUATION_ENUM.RDV_PRIS,
          }),
          _id: mleId,
        },
        { bypassDocumentValidation: true }
      );

      await missionLocaleEffectifsLogDb().insertMany(
        [
          {
            _id: new ObjectId(),
            mission_locale_effectif_id: mleId,
            situation: SITUATION_ENUM.RDV_PRIS,
            created_at: new Date("2026-03-05"),
            created_by: new ObjectId(),
            read_by: [],
          },
          {
            _id: new ObjectId(),
            mission_locale_effectif_id: mleId,
            situation: SITUATION_ENUM.NOUVEAU_PROJET,
            created_at: new Date("2026-03-10"),
            created_by: new ObjectId(),
            read_by: [],
          },
        ] as never,
        { bypassDocumentValidation: true }
      );

      const response = await requestAsOrganisation(
        { type: "ADMINISTRATEUR" },
        "get",
        "/api/v1/admin/collaborations/export"
      );

      expect(response.status).toBe(200);
      const row = response.data.details_collaborations.find(
        (d: { siret_cfa: string }) => d.siret_cfa === "12345678900034"
      );
      expect(row.date_traitement_ml).toBe("2026-03-05T00:00:00.000Z");
    });
  });
});
