import { beforeEach, describe, expect, it } from "vitest";

import { communesVoiesDb } from "@/common/model/collections";
import { useMongo } from "@tests/jest/setupMongo";

import { resoudreCodeInsee, viderCacheCommunesVoies } from "./resoudreCodeInsee";

describe("resoudreCodeInsee", () => {
  useMongo();

  beforeEach(async () => {
    viderCacheCommunesVoies();
    await communesVoiesDb().insertOne({
      _id: "02100",
      communes: [
        { code_insee: "02288", nom: "Essigny-le-Petit", population: 345 },
        { code_insee: "02525", nom: "Morcourt", population: 500 },
        { code_insee: "02691", nom: "Saint-Quentin", population: 52813 },
        { code_insee: "02340", nom: "Gauchy", population: 5000 },
      ],
      voies: [
        { nom: "rue sentier", code_insee: ["02691"] },
        { nom: "rue maurice duverget", code_insee: ["02525"] },
        { nom: "rue gare", code_insee: ["02288", "02525"] },
        { nom: "gare", code_insee: ["02525"] },
        { nom: "route gauchy", code_insee: ["02691"] },
        { nom: "rue pasteur", code_insee: ["02525"] },
      ],
      updated_at: new Date(),
    });
  });

  it("résout la commune par la rue", async () => {
    expect(await resoudreCodeInsee({ codePostal: "02100", adresse: "138 rue du Sentier" })).toEqual({
      code_insee: "02691",
      methode: "voie",
    });
    expect(await resoudreCodeInsee({ codePostal: "02100", adresse: "24, RUE MAURICE DUVERGET" })).toEqual({
      code_insee: "02525",
      methode: "voie",
    });
  });

  it("retient la voie la plus longue, puis le nom de commune si cette voie existe dans plusieurs communes", async () => {
    expect(await resoudreCodeInsee({ codePostal: "02100", adresse: "2 rue de la Gare Essigny-le-Petit" })).toEqual({
      code_insee: "02288",
      methode: "commune",
    });
  });

  it("utilise le nom de commune présent dans l'adresse quand la rue ne tranche pas", async () => {
    expect(
      await resoudreCodeInsee({ codePostal: "02100", adresse: "56 bis rue Alexandre Ribot saint quentin" })
    ).toEqual({ code_insee: "02691", methode: "commune" });
  });

  it("privilégie la commune citée sur la voie", async () => {
    expect(await resoudreCodeInsee({ codePostal: "02100", adresse: "3 rue Pasteur Saint-Quentin" })).toEqual({
      code_insee: "02691",
      methode: "commune",
    });
  });

  it("ne prend pas pour une commune citée le nom de commune qui fait partie de la voie", async () => {
    expect(await resoudreCodeInsee({ codePostal: "02100", adresse: "12 route de Gauchy" })).toEqual({
      code_insee: "02691",
      methode: "voie",
    });
  });

  it("laisse la voie décider quand plusieurs communes sont citées", async () => {
    expect(await resoudreCodeInsee({ codePostal: "02100", adresse: "3 rue Pasteur Saint-Quentin Gauchy" })).toEqual({
      code_insee: "02525",
      methode: "voie",
    });
  });

  it("limite le repli aux communes où la voie existe", async () => {
    expect(await resoudreCodeInsee({ codePostal: "02100", adresse: "5 rue de la Gare" })).toEqual({
      code_insee: "02525",
      methode: "population",
    });
  });

  it("se replie sur la commune la plus peuplée", async () => {
    expect(await resoudreCodeInsee({ codePostal: "02100", adresse: "3 rue Inconnue" })).toEqual({
      code_insee: "02691",
      methode: "population",
    });
    expect(await resoudreCodeInsee({ codePostal: "02100", adresse: null })).toEqual({
      code_insee: "02691",
      methode: "population",
    });
  });

  it("renvoie null pour un code postal absent du référentiel", async () => {
    expect(await resoudreCodeInsee({ codePostal: "02000", adresse: "1 rue de Laon" })).toBeNull();
  });
});
