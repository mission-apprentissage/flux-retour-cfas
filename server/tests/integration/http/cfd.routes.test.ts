import { AxiosInstance } from "axiosist";
import type { CfdInfo } from "shared/models/apis/@types/ApiAlternance";
import { it, expect, describe, beforeEach, vi } from "vitest";

import { getCfdInfo } from "@/common/apis/apiAlternance/apiAlternance";
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

  const cfd = "36T32603";
  const cfdInfo: CfdInfo = {
    date_fermeture: new Date("2026-08-31T23:59:59.000+02:00"),
    date_ouverture: new Date("2014-09-01T00:00:00.000+02:00"),
    niveau: "5",
    intitule_long: "TECHNICIEN SUPERIEUR SYSTEMES ET RESEAUX (TP)",
    rncps: [
      {
        code_rncp: "RNCP31115",
        intitule_diplome: "Technicien supérieur systèmes et réseaux",
        date_fin_validite_enregistrement: new Date("2023-09-01T23:59:59.000+02:00"),
        active_inactive: "INACTIVE",
        eligible_apprentissage: true,
        eligible_professionnalisation: true,
      },
      {
        code_rncp: "RNCP37682",
        intitule_diplome: "Technicien supérieur systèmes et réseaux",
        date_fin_validite_enregistrement: new Date("2026-09-01T23:59:59.000+02:00"),
        active_inactive: "ACTIVE",
        eligible_apprentissage: true,
        eligible_professionnalisation: true,
      },
    ],
  };

  beforeEach(async () => {
    app = await initTestApp();
    httpClient = app.httpClient;
    requestAsOrganisation = app.requestAsOrganisation;
    vi.mocked(getCfdInfo).mockResolvedValue(cfdInfo);
    await organismesDb().insertMany(organismes);
    await reseauxDb().insertMany(reseaux);
  });

  it("Vérifie qu'on ne peut pas accéder à la route sans être authentifié", async () => {
    const response = await httpClient.get(`/api/v1/rncp/${cfd}`);
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
        const response = await requestAsOrganisation(organisation, "get", `/api/v1/cfd/${cfd}`);

        expect(response.status).toEqual(allowed ? 200 : 403);
        expect(response.data).toEqual(JSON.parse(JSON.stringify(cfdInfo)));
        expect(getCfdInfo).toHaveBeenCalledWith(cfd);
      }
    );
  });
});
