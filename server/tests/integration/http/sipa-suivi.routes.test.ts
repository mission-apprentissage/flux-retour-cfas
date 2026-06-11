import { strict as assert } from "assert";

import { AxiosInstance } from "axiosist";
import jwt from "jsonwebtoken";
import merge from "lodash-es/merge";
import { ObjectId } from "mongodb";
import { IEffectif } from "shared/models/data/effectifs.model";
import { IOrganisme } from "shared/models/data/organismes.model";
import type { PartialDeep } from "type-fest";
import { it, describe, beforeEach } from "vitest";

import { effectifsDb, effectifsDECADb, organismesDb, sipaUsersDb } from "@/common/model/collections";
import { createSipaToken } from "@/common/utils/jwtUtils";
import { hash } from "@/common/utils/passwordUtils";
import config from "@/config";
import { createRandomOrganisme, createSampleEffectif } from "@tests/data/randomizedSample";
import { useMongo } from "@tests/jest/setupMongo";
import { id, initTestApp } from "@tests/utils/testUtils";

const SIPA_USERNAME = "sipa-omogen-test";
const D = (s: string) => new Date(`${s}T00:00:00.000Z`);

const makeOrganisme = (oid: string, departement: string, siret: string): IOrganisme => {
  const org = { _id: new ObjectId(oid), ...createRandomOrganisme({ siret }) } as IOrganisme;
  org.adresse = { ...org.adresse, departement };
  return org;
};

const orgLille = makeOrganisme(id(1), "59", "19040492100016");
const orgCorse = makeOrganisme(id(2), "2A", "19040492100017");
const orgReunion = makeOrganisme(id(3), "974", "41461021200014");

const baseParams = (): PartialDeep<IEffectif> => ({
  apprenant: { date_de_naissance: D("2009-01-01"), ine: null },
  formation: { date_entree: D("2025-09-15"), date_inscription: D("2025-07-01"), niveau: "5" },
  contrats: [],
});

async function buildEffectif(organisme: IOrganisme, params: PartialDeep<IEffectif> = {}) {
  return {
    _id: new ObjectId(),
    ...(await createSampleEffectif(merge({ organisme }, baseParams(), params) as any)),
  };
}

async function insertEffectif(organisme: IOrganisme, params: PartialDeep<IEffectif> = {}) {
  const effectif = await buildEffectif(organisme, params);
  await effectifsDb().insertOne(effectif as any);
  return effectif;
}

async function insertEffectifDECA(organisme: IOrganisme, params: PartialDeep<IEffectif> = {}) {
  const effectif = await buildEffectif(organisme, merge({ source: "DECA" }, params));
  await effectifsDECADb().insertOne({ ...effectif, deca_raw_id: new ObjectId() } as any);
  return effectif;
}

let app: Awaited<ReturnType<typeof initTestApp>>;
let httpClient: AxiosInstance;
let authToken: string;

async function getSuivi(params: Record<string, unknown> = {}, token: string | null = authToken) {
  return httpClient.get("/api/v2/affelnet/suivi", {
    params: {
      dateDebutFormationMin: "2025-06-01",
      dateDebutFormationMax: "2026-05-31",
      departements: "059",
      ...params,
    },
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
}

describe("GET /api/v2/affelnet/suivi", () => {
  useMongo();
  beforeEach(async () => {
    app = await initTestApp();
    httpClient = app.httpClient;
    await organismesDb().insertMany([orgLille, orgCorse, orgReunion]);
    await sipaUsersDb().insertOne({
      _id: new ObjectId(),
      username: SIPA_USERNAME,
      password: hash("sipa-test-password"),
      created_at: new Date(),
    });
    authToken = createSipaToken(SIPA_USERNAME);
  });

  describe("Conversion des codes départements (INSEE 3 caractères ⇄ base)", () => {
    it("entrée '059' matche un organisme stocké '59', sortie re-paddée '059'", async () => {
      await insertEffectif(orgLille);

      const response = await getSuivi({ departements: "059" });

      assert.strictEqual(response.status, 200);
      assert.strictEqual(response.data.metadonnees.totalElements, 1);
      assert.strictEqual(response.data.effectifs[0].organismeFormation.departement, "059");
    });

    it("'02A' matche la Corse stockée '2A'", async () => {
      await insertEffectif(orgCorse);

      const response = await getSuivi({ departements: "02A" });

      assert.strictEqual(response.data.metadonnees.totalElements, 1);
      assert.strictEqual(response.data.effectifs[0].organismeFormation.departement, "02A");
    });

    it("'974' (DOM, déjà 3 caractères en base) matche tel quel", async () => {
      await insertEffectif(orgReunion);

      const response = await getSuivi({ departements: "974" });

      assert.strictEqual(response.data.metadonnees.totalElements, 1);
      assert.strictEqual(response.data.effectifs[0].organismeFormation.departement, "974");
    });

    it("plusieurs départements en CSV", async () => {
      await insertEffectif(orgLille);
      await insertEffectif(orgCorse);

      const response = await getSuivi({ departements: "059,02A" });

      assert.strictEqual(response.data.metadonnees.totalElements, 2);
    });

    it("code hors annexe ou hors format → 422 avec message explicite", async () => {
      for (const code of ["000", "999", "59", "9A4"]) {
        const response = await getSuivi({ departements: code });
        assert.strictEqual(response.status, 422, `code ${code}`);
        assert.ok(response.data.message, `code ${code}`);
      }
    });

    it("code COM valide de l'annexe ('975') → 200 + liste vide, pas 422", async () => {
      const response = await getSuivi({ departements: "975" });

      assert.strictEqual(response.status, 200);
      assert.strictEqual(response.data.metadonnees.totalElements, 0);
      assert.deepStrictEqual(response.data.effectifs, []);
    });
  });

  describe("Filtres métier (RG contrat §4.2)", () => {
    it("plage de dates : hors plage exclu, bornes incluses (borne haute fin de journée)", async () => {
      await insertEffectif(orgLille, { formation: { date_entree: D("2025-05-31") } }); // avant min
      await insertEffectif(orgLille, { formation: { date_entree: D("2026-06-01") } }); // après max
      await insertEffectif(orgLille, { formation: { date_entree: D("2025-06-01") } }); // borne min
      await insertEffectif(orgLille, { formation: { date_entree: D("2026-05-31") } }); // borne max

      const response = await getSuivi();

      assert.strictEqual(response.data.metadonnees.totalElements, 2);
      const dates = response.data.effectifs.map((e: any) => e.formation.dateDebutFormation).sort();
      assert.deepStrictEqual(dates, ["2025-06-01", "2026-05-31"]);
    });

    it("âge : 17 ans inclus, 18 ans pile le jour de la rentrée exclu, ddn absente exclue", async () => {
      await insertEffectif(orgLille, {
        apprenant: { nom: "DIXSEPT", date_de_naissance: D("2008-09-16") }, // 17 ans et 364 j au 2025-09-15
      });
      await insertEffectif(orgLille, {
        apprenant: { nom: "DIXHUIT", date_de_naissance: D("2007-09-15") }, // 18 ans pile
      });
      await insertEffectif(orgLille, { apprenant: { nom: "SANSDDN", date_de_naissance: null } });

      const response = await getSuivi();

      assert.strictEqual(response.data.metadonnees.totalElements, 1);
      assert.strictEqual(response.data.effectifs[0].apprenant.nom, "DIXSEPT");
    });

    it("âge : composantes horaires parasites (ddn ou date d'entrée) sans effet sur la borne des 18 ans", async () => {
      // 18 ans pile le jour de la rentrée : exclu quelle que soit l'heure stockée
      await insertEffectif(orgLille, {
        apprenant: { nom: "DDNAVECHEURE", date_de_naissance: new Date("2007-09-15T14:30:00.000Z") },
      });
      await insertEffectif(orgLille, {
        apprenant: { nom: "ENTREEAVECHEURE", date_de_naissance: D("2007-09-15") },
        formation: { date_entree: new Date("2025-09-15T08:00:00.000Z") },
      });

      const response = await getSuivi();

      assert.strictEqual(response.data.metadonnees.totalElements, 0);
    });

    it("niveau : seuls 3/4/5 transmis (niveau 6 ou null exclus)", async () => {
      await insertEffectif(orgLille, { apprenant: { nom: "NIVEAUTROIS" }, formation: { niveau: "3" } });
      await insertEffectif(orgLille, { apprenant: { nom: "NIVEAUSIX" }, formation: { niveau: "6" } });
      await insertEffectif(orgLille, { apprenant: { nom: "SANSNIVEAU" }, formation: { niveau: null } });

      const response = await getSuivi();

      assert.strictEqual(response.data.metadonnees.totalElements, 1);
      assert.strictEqual(response.data.effectifs[0].apprenant.nom, "NIVEAUTROIS");
    });
  });

  describe("Déduplication (DECA prioritaire, fusion INE)", () => {
    const identite = { nom: "DUPONT", prenom: "Jean", date_de_naissance: D("2009-03-10") };

    it("même jeune ERP + DECA → ligne DECA retenue, INE de la ligne ERP conservé (fusion)", async () => {
      await insertEffectif(orgLille, { apprenant: { ...identite, ine: "123456789AB" } });
      await insertEffectifDECA(orgLille, { apprenant: { ...identite, ine: null } });

      const response = await getSuivi();

      assert.strictEqual(response.data.metadonnees.totalElements, 1);
      assert.strictEqual(response.data.effectifs[0].source, "DECA");
      assert.strictEqual(response.data.effectifs[0].apprenant.ine, "123456789AB");
    });

    it("ligne gagnante avec INE + écartée avec INE différent → INE du gagnant (pas le $max)", async () => {
      await insertEffectif(orgLille, { apprenant: { ...identite, ine: "123456789ZZ" } });
      await insertEffectifDECA(orgLille, { apprenant: { ...identite, ine: "123456789AA" } });

      const response = await getSuivi();

      assert.strictEqual(response.data.metadonnees.totalElements, 1);
      // DECA gagne ; son INE prime sur le $max lexicographique des écartés ("…ZZ")
      assert.strictEqual(response.data.effectifs[0].apprenant.ine, "123456789AA");
    });

    it("même jeune sur 2 lignes ERP → date_inscription la plus récente retenue", async () => {
      await insertEffectif(orgLille, {
        apprenant: identite,
        formation: { date_inscription: D("2025-07-01"), libelle_long: "ANCIENNE INSCRIPTION" },
      });
      await insertEffectif(orgLille, {
        apprenant: identite,
        formation: { date_inscription: D("2025-08-01"), libelle_long: "INSCRIPTION RECENTE" },
      });

      const response = await getSuivi();

      assert.strictEqual(response.data.metadonnees.totalElements, 1);
      assert.strictEqual(response.data.effectifs[0].formation.intituleDiplome, "INSCRIPTION RECENTE");
    });

    it("accents / casse / espaces : 'Élise' et 'elise  ' sont dédupliquées", async () => {
      await insertEffectif(orgLille, {
        apprenant: { nom: "DURAND", prenom: "Élise", date_de_naissance: D("2009-05-05") },
      });
      await insertEffectifDECA(orgLille, {
        apprenant: { nom: "durand ", prenom: "elise  ", date_de_naissance: D("2009-05-05") },
      });

      const response = await getSuivi();

      assert.strictEqual(response.data.metadonnees.totalElements, 1);
    });

    it("INE ambigus dans le groupe (homonymes réels) → aucun INE de repli attribué", async () => {
      // deux INE distincts prouvent deux jeunes différents : on ne doit pas
      // attribuer l'INE de l'un à la ligne DECA gagnante (croisement Affelnet)
      await insertEffectif(orgLille, { apprenant: { ...identite, ine: "111111111AA" } });
      await insertEffectif(orgLille, { apprenant: { ...identite, ine: "222222222BB" } });
      await insertEffectifDECA(orgLille, { apprenant: { ...identite, ine: null } });

      const response = await getSuivi();

      assert.strictEqual(response.data.effectifs[0].source, "DECA");
      assert.strictEqual(response.data.effectifs[0].apprenant.ine, null);
    });

    it("ddn à des heures différentes (ERP vs DECA) → dédupliquées (troncature au jour)", async () => {
      await insertEffectif(orgLille, {
        apprenant: { ...identite, date_de_naissance: new Date("2009-03-10T00:00:00.000Z") },
      });
      await insertEffectifDECA(orgLille, {
        apprenant: { ...identite, date_de_naissance: new Date("2009-03-10T14:30:00.000Z") },
      });

      const response = await getSuivi();

      assert.strictEqual(response.data.metadonnees.totalElements, 1);
    });
  });

  describe("Pagination et stabilité", () => {
    it("métadonnées correctes ; page > totalPages → 200 + liste vide ; réponses stables", async () => {
      await insertEffectif(orgLille, { apprenant: { nom: "AAA" } });
      await insertEffectif(orgLille, { apprenant: { nom: "BBB" } });
      await insertEffectif(orgLille, { apprenant: { nom: "CCC" } });

      const page1 = await getSuivi({ page: "1" });
      assert.deepStrictEqual(page1.data.metadonnees, { page: 1, totalPages: 1, totalElements: 3 });
      assert.strictEqual(page1.data.effectifs.length, 3);

      const page2 = await getSuivi({ page: "2" });
      assert.strictEqual(page2.status, 200);
      assert.deepStrictEqual(page2.data.effectifs, []);
      assert.strictEqual(page2.data.metadonnees.totalElements, 3);

      const page1bis = await getSuivi({ page: "1" });
      assert.deepStrictEqual(page1bis.data, page1.data);
    });
  });

  describe("DTO (mapping contrat)", () => {
    it("source CFA pour ERP/FICHIER, dates en AAAA-MM-JJ UTC", async () => {
      await insertEffectif(orgLille, { source: "ERP" });

      const { data } = await getSuivi();
      const effectif = data.effectifs[0];

      assert.strictEqual(effectif.source, "CFA");
      assert.strictEqual(effectif.apprenant.dateNaissance, "2009-01-01");
      assert.strictEqual(effectif.formation.dateDebutFormation, "2025-09-15");
      assert.strictEqual(effectif.formation.dateInscriptionCfa, "2025-07-01");
      assert.strictEqual(effectif.formation.diplomeNiveau, "5");
      assert.strictEqual(effectif.organismeFormation.uaiCfa, orgLille.uai);
      assert.strictEqual(effectif.organismeFormation.siret, orgLille.siret);
      assert.strictEqual(effectif.organismeFormation.denomination, orgLille.nom);
    });

    it("contrats : dernier par date_debut, rompu transmis, dateConclusionContrat null, date_debut null ignoré", async () => {
      await insertEffectif(orgLille, {
        contrats: [
          { date_debut: D("2025-10-01"), date_fin: D("2027-06-30") },
          { date_debut: D("2025-11-01"), date_fin: D("2027-07-31"), date_rupture: D("2026-01-15") },
          { date_debut: null, date_fin: D("2099-12-31") },
        ] as any,
      });

      const { data } = await getSuivi();

      assert.deepStrictEqual(data.effectifs[0].contrats, {
        dateDebutContrat: "2025-11-01",
        dateFinContrat: "2027-07-31",
        dateConclusionContrat: null,
      });
    });

    it("aucun contrat (ou aucun avec date_debut) → bloc contrats null", async () => {
      await insertEffectif(orgLille, { contrats: [] });

      const { data } = await getSuivi();

      assert.strictEqual(data.effectifs[0].contrats, null);
    });

    it("adresse : fallback concaténation quand adresse.complete absente", async () => {
      const orgSansComplete = makeOrganisme(id(4), "59", "77568013501089");
      orgSansComplete.adresse = {
        numero: 12,
        voie: "RUE DES TESTS",
        code_postal: "59000",
        commune: "LILLE",
        departement: "59",
      } as any;
      await organismesDb().insertOne(orgSansComplete);
      await insertEffectif(orgSansComplete);

      const { data } = await getSuivi();

      assert.strictEqual(data.effectifs[0].organismeFormation.adresse, "12 RUE DES TESTS 59000 LILLE");
    });

    it("troncature : intituleDiplome > 500 caractères → tronqué, ligne transmise", async () => {
      await insertEffectif(orgLille, { formation: { libelle_long: "X".repeat(600) } });

      const { data } = await getSuivi();

      assert.strictEqual(data.effectifs[0].formation.intituleDiplome, "X".repeat(500));
    });
  });

  describe("Erreurs (codes contrat §3.4)", () => {
    it("401 sans Bearer, 403 si scope ≠ sipa", async () => {
      const sansToken = await getSuivi({}, null);
      assert.strictEqual(sansToken.status, 401);

      const mauvaisScope = jwt.sign({ scope: "user" }, config.auth.sipa.jwtSecret as string, {
        issuer: config.appName,
      });
      const response = await getSuivi({}, mauvaisScope);
      assert.strictEqual(response.status, 403);
    });

    it("422 avec message explicite : date impossible, dateMin > dateMax, > 10 départements", async () => {
      const dateImpossible = await getSuivi({ dateDebutFormationMin: "2026-02-31" });
      assert.strictEqual(dateImpossible.status, 422);
      assert.match(dateImpossible.data.message, /date invalide/);

      const datesInversees = await getSuivi({
        dateDebutFormationMin: "2026-05-31",
        dateDebutFormationMax: "2025-06-01",
      });
      assert.strictEqual(datesInversees.status, 422);

      const onzeDepartements = await getSuivi({
        departements: ["001", "002", "003", "004", "005", "006", "007", "008", "009", "010", "011"].join(","),
      });
      assert.strictEqual(onzeDepartements.status, 422);
      assert.match(onzeDepartements.data.message, /Maximum 10/);
    });

    it("400 : paramètre obligatoire absent, page invalide", async () => {
      const sansDateMin = await getSuivi({ dateDebutFormationMin: undefined });
      assert.strictEqual(sansDateMin.status, 400);

      const pageZero = await getSuivi({ page: "0" });
      assert.strictEqual(pageZero.status, 400);
    });

    it("paramètre de query inconnu ignoré (cache-buster, trace id d'un proxy) → 200", async () => {
      await insertEffectif(orgLille);

      const response = await getSuivi({ _: "1749550000", traceId: "abc-123" });

      assert.strictEqual(response.status, 200);
      assert.strictEqual(response.data.metadonnees.totalElements, 1);
    });
  });
});
