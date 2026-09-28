import type { ICommune } from "api-alternance-sdk";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { communesVoiesDb } from "@/common/model/collections";
import { viderCacheCommunesVoies } from "@/common/services/commune/resoudreCodeInsee";
import { useMongo } from "@tests/jest/setupMongo";

import { estCommuneParDefaut, getCommune } from "./apiAlternance";
import { apiAlternanceClient } from "./client";

vi.mock("@/common/apis/apiAlternance/client", () => ({
  apiAlternanceClient: { geographie: { rechercheCommune: vi.fn() } },
}));

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
