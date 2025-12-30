import { AxiosInstance } from "axiosist";
import type { RncpInfo } from "shared/models/apis/@types/ApiAlternance";
import { it, expect, describe, beforeEach, vi } from "vitest";

import { getRncpInfo } from "@/common/apis/apiAlternance/apiAlternance";
import { organismesDb, reseauxDb } from "@/common/model/collections";
import { useMongo } from "@tests/jest/setupMongo";
import { organismes, reseaux, testPermissions } from "@tests/utils/permissions";
import { RequestAsOrganisationFunc, expectUnauthorizedError, initTestApp } from "@tests/utils/testUtils";

let app: Awaited<ReturnType<typeof initTestApp>>;
let httpClient: AxiosInstance;
let requestAsOrganisation: RequestAsOrganisationFunc;

vi.mock("@/common/apis/apiAlternance/apiAlternance");

describe("GET /api/v1/rncp/:code_rncp - retourne une fiche RNCP", () => {
  useMongo();

  const rncpInfo: RncpInfo = {
    code_rncp: "RNCP37682",
    intitule: "Technicien supérieur systèmes et réseaux",
    niveau: "5",
    date_fin_validite_enregistrement: new Date("2026-09-01T23:59:59.000+02:00"),
    actif: true,
    eligible_apprentissage: true,
    eligible_professionnalisation: true,
    romes: [
      {
        code: "I1401",
        intitule: "Maintenance informatique et bureautique",
      },
      {
        code: "M1810",
        intitule: "Production et exploitation de systèmes d''information",
      },
    ],
  };

  beforeEach(async () => {
    app = await initTestApp();
    httpClient = app.httpClient;
    requestAsOrganisation = app.requestAsOrganisation;
    vi.mocked(getRncpInfo).mockResolvedValue(rncpInfo);
    await organismesDb().insertMany(organismes);
    await reseauxDb().insertMany(reseaux);
  });

  it("Vérifie qu'on ne peut pas accéder à la route sans être authentifié", async () => {
    const response = await httpClient.get(`/api/v1/rncp/${rncpInfo.code_rncp}`);
    expectUnauthorizedError(response);
  });

  describe("Permissions", () => {
    testPermissions(
      {
        "OF cible": true,
        "OF non lié": true,
        "OF formateur": true,
        "OF responsable": true,
        "Tête de réseau même réseau": true,
        "Tête de réseau Responsable": true,
        "Tête de réseau autre réseau": true,
        "DREETS même région": true,
        "DREETS autre région": true,
        "DRAFPIC régional même région": true,
        "DRAFPIC régional autre région": true,
        "DRAAF même région": true,
        "DRAAF autre région": true,
        "Conseil Régional même région": true,
        "Conseil Régional autre région": true,
        "DDETS même département": true,
        "DDETS autre département": true,
        "Académie même académie": true,
        "Académie autre académie": true,
        "Opérateur public national": true,
        Administrateur: true,
      },
      async (organisation, allowed) => {
        const response = await requestAsOrganisation(organisation, "get", `/api/v1/rncp/${rncpInfo.code_rncp}`);

        expect(response.status).toEqual(allowed ? 200 : 403);
        expect(response.data).toEqual(JSON.parse(JSON.stringify(rncpInfo)));
        expect(getRncpInfo).toHaveBeenCalledWith(rncpInfo.code_rncp);
      }
    );
  });
});
