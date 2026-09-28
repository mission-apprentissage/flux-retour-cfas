import { gzipSync } from "node:zlib";

import nock from "nock";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { communesVoiesDb } from "@/common/model/collections";
import {
  BAN_ADRESSES_URL,
  GEO_API_COMMUNES_URL,
  hydrateCommunesVoies,
} from "@/jobs/hydrate/communes-voies/hydrate-communes-voies";
import { useMongo } from "@tests/jest/setupMongo";

const communes = [
  { code: "02691", nom: "Saint-Quentin", codesPostaux: ["02100"], population: 52813, codeDepartement: "02" },
  { code: "02288", nom: "Essigny-le-Petit", codesPostaux: ["02100"], population: 345, codeDepartement: "02" },
  { code: "02408", nom: "Laon", codesPostaux: ["02000"], population: 24000, codeDepartement: "02" },
  { code: "04001", nom: "Commune04", codesPostaux: ["05110"], population: 100, codeDepartement: "04" },
  { code: "05001", nom: "Commune05", codesPostaux: ["05110"], population: 200, codeDepartement: "05" },
  { code: "13055", nom: "Marseille", codesPostaux: ["13012"], population: 870000, codeDepartement: "13" },
  { code: "13001", nom: "Allauch", codesPostaux: ["13012"], population: 21000, codeDepartement: "13" },
];

const ENTETE = "id;id_fantoir;numero;rep;nom_voie;code_postal;code_insee;nom_commune;nom_ld";

function csvGz(lignes: string[]) {
  return gzipSync([ENTETE, ...lignes].join("\n"));
}

const banParDepartement: Record<string, Buffer> = {
  "02": csvGz([
    "a;;138;;Rue du Sentier;02100;02691;Saint-Quentin;",
    "b;;1;;Rue de la Gare;02100;02691;Saint-Quentin;",
    "c;;2;;Rue de la Gare;02100;02288;Essigny-le-Petit;",
    "d;;3;;Rue de Laon;02000;02408;Laon;",
    "e;;4;;Rue Fantôme;02100;02999;Hors liste;",
  ]),
  "04": csvGz(["h;;2;;Route des Crêtes;05110;04001;Commune04;"]),
  "05": csvGz(["f;;1;;Chemin des Alpes;05110;05001;Commune05;Le Hameau"]),
  "13": csvGz(["g;;1;;Boulevard de la Valbarelle;13012;13212;Marseille 12e Arrondissement;"]),
};

function mockApis(departementsAbsents: string[] = []) {
  nock(GEO_API_COMMUNES_URL).get(/.*/).reply(200, communes);
  for (const [departement, fichier] of Object.entries(banParDepartement)) {
    const scope = nock(BAN_ADRESSES_URL).get(`/adresses-${departement}.csv.gz`);
    if (departementsAbsents.includes(departement)) scope.reply(404);
    else scope.reply(200, fichier);
  }
}

describe("hydrateCommunesVoies", () => {
  useMongo();

  beforeEach(() => {
    nock.disableNetConnect();
  });

  afterEach(() => {
    nock.cleanAll();
    nock.enableNetConnect();
  });

  it("indexe les voies des seuls codes postaux multi-communes", async () => {
    mockApis();

    await hydrateCommunesVoies();

    const doc = await communesVoiesDb().findOne({ _id: "02100" });
    expect(doc?.communes).toEqual([
      { code_insee: "02691", nom: "Saint-Quentin", population: 52813 },
      { code_insee: "02288", nom: "Essigny-le-Petit", population: 345 },
    ]);
    expect(doc?.voies).toEqual(
      expect.arrayContaining([
        { nom: "rue sentier", code_insee: ["02691"] },
        { nom: "rue gare", code_insee: ["02288", "02691"] },
      ])
    );
    expect(doc?.voies).toHaveLength(2);
    expect(await communesVoiesDb().findOne({ _id: "02000" })).toBeNull();
  });

  it("gère les codes postaux à cheval sur deux départements", async () => {
    mockApis();

    await hydrateCommunesVoies();

    const doc = await communesVoiesDb().findOne({ _id: "05110" });
    expect(doc?.communes.map((c) => c.code_insee)).toEqual(["04001", "05001"]);
    expect(doc?.voies).toEqual(
      expect.arrayContaining([
        { nom: "route cretes", code_insee: ["04001"] },
        { nom: "chemin alpes", code_insee: ["05001"] },
        { nom: "hameau", code_insee: ["05001"] },
      ])
    );
  });

  it("conserve les codes postaux d'un département dont le fichier BAN est absent", async () => {
    const ancien = {
      communes: [{ code_insee: "04001", nom: "Commune04", population: 100 }],
      voies: [{ nom: "route cretes", code_insee: ["04001"] }],
      updated_at: new Date(0),
    };
    await communesVoiesDb().insertOne({ _id: "05110", ...ancien });
    mockApis(["04"]);

    await hydrateCommunesVoies();

    expect(await communesVoiesDb().findOne({ _id: "05110" })).toEqual({ _id: "05110", ...ancien });
    expect((await communesVoiesDb().findOne({ _id: "02100" }))?.updated_at).not.toEqual(new Date(0));
    expect(await communesVoiesDb().findOne({ _id: "13012" })).not.toBeNull();
  });

  it("n'écrit pas de voies partielles pour un code postal dont un département est absent", async () => {
    mockApis(["04"]);

    await hydrateCommunesVoies();

    expect(await communesVoiesDb().findOne({ _id: "05110" })).toBeNull();
    expect(await communesVoiesDb().countDocuments()).toBe(2);
  });

  it("rattache les arrondissements municipaux à leur commune", async () => {
    mockApis();

    await hydrateCommunesVoies();

    const doc = await communesVoiesDb().findOne({ _id: "13012" });
    expect(doc?.voies).toEqual([{ nom: "boulevard valbarelle", code_insee: ["13055"] }]);
  });

  it("supprime les codes postaux qui ne sont plus ambigus", async () => {
    await communesVoiesDb().insertOne({ _id: "99999", communes: [], voies: [], updated_at: new Date(0) });
    mockApis();

    await hydrateCommunesVoies();

    expect(await communesVoiesDb().findOne({ _id: "99999" })).toBeNull();
    expect(await communesVoiesDb().countDocuments()).toBe(3);
  });

  it("conserve l'ancien référentiel si le volume chute", async () => {
    await communesVoiesDb().insertMany(
      Array.from({ length: 10 }, (_, i) => ({
        _id: `9900${i}`,
        communes: [],
        voies: [],
        updated_at: new Date(0),
      }))
    );
    mockApis();

    await expect(hydrateCommunesVoies()).rejects.toThrow(/codes postaux écrits/);
    expect(await communesVoiesDb().countDocuments({ updated_at: new Date(0) })).toBe(10);
  });
});
