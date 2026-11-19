import { ApiError, type ICommune } from "api-alternance-sdk";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { communesVoiesDb } from "@/common/model/collections";
import { viderCacheCommunesVoies } from "@/common/services/commune/resoudreCodeInsee";
import { captureTiered } from "@/common/services/sentry/alertContract";
import { reportDependencyHealth } from "@/common/services/sentry/reportOnce";
import { useMongo } from "@tests/jest/setupMongo";

import { estCommuneParDefaut, getCommune } from "./apiAlternance";
import { apiAlternanceClient } from "./client";
import { viderRequetesRefuseesSignalees } from "./requeteRefusee";

vi.mock("@/common/apis/apiAlternance/client", () => ({
  apiAlternanceClient: { geographie: { rechercheCommune: vi.fn() } },
}));
vi.mock("@/common/services/sentry/alertContract", () => ({ captureTiered: vi.fn() }));
vi.mock("@/common/services/sentry/reportOnce", () => ({ reportDependencyHealth: vi.fn() }));

const apiError = (statusCode: number, errorData: unknown) =>
  new ApiError({
    path: "/v1/geographie/commune/search",
    params: {},
    querystring: {},
    requestHeaders: {},
    statusCode,
    message: "",
    name: "",
    responseHeaders: {},
    errorData,
  });

function commune(insee: string, nom: string, postaux: string[], missionLocaleId: number): ICommune {
  return {
    nom,
    code: { insee, postaux },
    anciennes: [],
    arrondissements: [],
    departement: { nom: "Aisne", codeInsee: "02" },
    region: { nom: "Hauts-de-France", codeInsee: "32" },
    academie: { id: "A20", code: "20", nom: "Amiens" },
    localisation: {
      centre: { type: "Point", coordinates: [3.28, 49.84] },
      bbox: { type: "Polygon", coordinates: [] },
    },
    mission_locale: { id: missionLocaleId } as ICommune["mission_locale"],
  };
}

const essigny = commune("02288", "Essigny-le-Petit", ["02100"], 486);
const saintQuentin = commune("02691", "Saint-Quentin", ["02100"], 486);
const laon = commune("02408", "Laon", ["02000"], 485);

describe("getCommune", () => {
  useMongo();

  beforeEach(async () => {
    viderCacheCommunesVoies();
    vi.mocked(apiAlternanceClient.geographie.rechercheCommune).mockImplementation(async ({ code }) =>
      code === "02000" ? [laon] : [essigny, saintQuentin]
    );
    await communesVoiesDb().insertOne({
      _id: "02100",
      communes: [
        { code_insee: "02288", nom: "Essigny-le-Petit", population: 345 },
        { code_insee: "02691", nom: "Saint-Quentin", population: 52813 },
      ],
      voies: [{ nom: "rue sentier", code_insee: ["02691"] }],
      updated_at: new Date(),
    });
  });

  it("résout la commune d'un code postal partagé à partir de l'adresse", async () => {
    expect(await getCommune({ codePostal: "02100", adresse: "138 rue du Sentier" })).toBe(saintQuentin);
  });

  it("retient la commune la plus peuplée sans adresse exploitable", async () => {
    expect(await getCommune({ codePostal: "02100" })).toBe(saintQuentin);
  });

  it("garde l'INSEE transmis, même s'il désigne la plus petite commune", async () => {
    expect(await getCommune({ codePostal: "02100", codeInsee: "02288", adresse: "138 rue du Sentier" })).toBe(essigny);
  });

  it("renvoie la première commune si le code postal est absent du référentiel", async () => {
    await communesVoiesDb().deleteMany({});
    viderCacheCommunesVoies();
    expect(await getCommune({ codePostal: "02100", adresse: "138 rue du Sentier" })).toBe(essigny);
  });

  it("renvoie l'unique commune d'un code postal non partagé", async () => {
    expect(await getCommune({ codePostal: "02000" })).toBe(laon);
  });
});

describe("getCommune, quand api-alternance échoue", () => {
  beforeEach(() => {
    vi.mocked(captureTiered).mockClear();
    vi.mocked(reportDependencyHealth).mockClear();
    viderRequetesRefuseesSignalees();
  });

  it("ne signale pas une panne sur un 400, mais le capture une fois avec le corps de la réponse", async () => {
    const errorData = { validationError: [{ instancePath: "/code", message: "Invalid input" }] };
    vi.mocked(apiAlternanceClient.geographie.rechercheCommune)
      .mockRejectedValueOnce(apiError(400, errorData))
      .mockRejectedValueOnce(apiError(400, errorData));

    await expect(getCommune({ codePostal: "0210" })).rejects.toThrow("api-alternance: échec de rechercheCommune");
    await expect(getCommune({ codePostal: "0210" })).rejects.toThrow("api-alternance: échec de rechercheCommune");

    expect(reportDependencyHealth).not.toHaveBeenCalledWith(
      expect.anything(),
      false,
      expect.anything(),
      expect.anything()
    );
    expect(captureTiered).toHaveBeenCalledOnce();
    expect(captureTiered).toHaveBeenCalledWith(
      expect.any(ApiError),
      expect.objectContaining({
        tier: "jour",
        fingerprintKey: "api-alternance:rechercheCommune:requete-refusee",
        extra: { errorData },
      })
    );
  });

  it("signale une panne sur une autre erreur", async () => {
    vi.mocked(apiAlternanceClient.geographie.rechercheCommune).mockRejectedValueOnce(apiError(503, null));

    await expect(getCommune({ codePostal: "02100" })).rejects.toThrow("api-alternance: échec de rechercheCommune");

    expect(reportDependencyHealth).toHaveBeenCalledWith(
      "api-alternance:rechercheCommune",
      false,
      expect.anything(),
      expect.objectContaining({ upstream: "api-alternance" })
    );
    expect(captureTiered).not.toHaveBeenCalled();
  });
});

describe("estCommuneParDefaut", () => {
  beforeEach(() => {
    vi.mocked(apiAlternanceClient.geographie.rechercheCommune).mockReset();
    vi.mocked(apiAlternanceClient.geographie.rechercheCommune).mockResolvedValue([laon, essigny, saintQuentin]);
  });

  it("considère une commune absente comme devinée, sans appeler l'API", async () => {
    expect(await estCommuneParDefaut("02100", null)).toBe(true);
    expect(apiAlternanceClient.geographie.rechercheCommune).not.toHaveBeenCalled();
  });

  it("reconnaît la première commune du code postal renvoyée par l'API", async () => {
    expect(await estCommuneParDefaut("02100", "02288")).toBe(true);
    expect(await estCommuneParDefaut("02100", "02691")).toBe(false);
  });

  it("considère la commune comme devinée si l'API échoue", async () => {
    vi.mocked(apiAlternanceClient.geographie.rechercheCommune).mockRejectedValue(new Error("API indisponible"));
    expect(await estCommuneParDefaut("02100", "02691")).toBe(true);
  });
});
