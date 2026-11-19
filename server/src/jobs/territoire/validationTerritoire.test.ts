import type { IDepartement as IApiDepartement } from "api-alternance-sdk";
import { DEPARTEMENTS_BY_CODE } from "shared/constants";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { apiAlternanceClient } from "@/common/apis/apiAlternance/client";

import { validationTerritoires } from "./validationTerritoire";

vi.mock("@/common/apis/apiAlternance/client", () => ({
  apiAlternanceClient: { geographie: { listDepartements: vi.fn() } },
}));
vi.mock("@/common/logger", () => ({ default: { warn: vi.fn(), info: vi.fn(), error: vi.fn() } }));

// Reproduit la réponse de l'API : les académies n'ont pas de champ id propre au TDB, et les TAAF
// remontent l'académie « Étranger » avec le code 984 (anomalie constatée le 17/11/2026)
function departementsApi(): IApiDepartement[] {
  return Object.values(DEPARTEMENTS_BY_CODE).map((departement) => ({
    nom: departement.nom,
    codeInsee: departement.code,
    region: { codeInsee: departement.region.code, nom: departement.region.nom },
    academie: {
      id: `A${departement.academie.code}`,
      code: departement.code === "984" ? "984" : departement.academie.code,
      nom: departement.academie.nom,
    },
  })) as IApiDepartement[];
}

describe("validationTerritoires", () => {
  beforeEach(() => {
    vi.mocked(apiAlternanceClient.geographie.listDepartements).mockResolvedValue(departementsApi());
  });

  it("ne signale aucune divergence quand l'API correspond aux constantes, malgré le champ id local et l'anomalie des TAAF", async () => {
    expect(await validationTerritoires()).toBe(0);
  });

  it("signale le renommage d'une académie, une fois pour l'académie et une fois par département concerné", async () => {
    const departements = departementsApi().map((d) =>
      d.academie.code === "10" ? { ...d, academie: { ...d.academie, nom: "Lyon renommée" } } : d
    ) as IApiDepartement[];
    vi.mocked(apiAlternanceClient.geographie.listDepartements).mockResolvedValue(departements);

    const departementsDeLyon = Object.values(DEPARTEMENTS_BY_CODE).filter((d) => d.academie.code === "10").length;
    expect(await validationTerritoires()).toBe(departementsDeLyon + 1);
  });

  it("signale une académie inconnue", async () => {
    const departements = departementsApi().map((d) =>
      d.codeInsee === "01" ? { ...d, academie: { id: "A99", code: "99", nom: "Nouvelle académie" } } : d
    ) as IApiDepartement[];
    vi.mocked(apiAlternanceClient.geographie.listDepartements).mockResolvedValue(departements);

    // le département change, et l'académie 99 n'est pas dans la liste
    expect(await validationTerritoires()).toBe(2);
  });

  it("ne tolère l'anomalie des TAAF que pour l'académie A00 avec le code 984", async () => {
    const departements = departementsApi().map((d) =>
      d.codeInsee === "984" ? { ...d, academie: { ...d.academie, id: "A98" } } : d
    ) as IApiDepartement[];
    vi.mocked(apiAlternanceClient.geographie.listDepartements).mockResolvedValue(departements);

    expect(await validationTerritoires()).toBeGreaterThan(0);
  });
});
