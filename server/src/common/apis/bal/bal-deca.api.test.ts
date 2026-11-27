import nock from "nock";
import { afterEach, beforeAll, describe, expect, it } from "vitest";

import {
  creerClientDecaBal,
  ErreurApiDecaBal,
  lireExpirationCle,
  lirePagesContratsDeca,
  type PageContratsDecaBal,
} from "./bal-deca.api";

const BAL = "https://bal.test";
const CLE = "cle-de-test";
const id = (n: number) => n.toString(16).padStart(24, "0");

const contrat = (n: number) => ({
  _id: id(n),
  updated_at: "2026-11-20T00:00:00.000Z",
  no_contrat: `C${n}`,
  statut: null,
  type_employeur: 11,
  date_debut_contrat: "2025-09-01T00:00:00.000Z",
  alternant: { nom: "DUPONT", prenom: "Jean", date_naissance: "2006-01-01T00:00:00.000Z", adresse: null },
  formation: null,
  employeur: null,
  organisme_formation: { siret: "77937827200016", uai_cfa: "0802004U" },
  etablissement_formation: null,
});

const page = (numeros: number[], next: string | null, ecartes = 0) => ({
  contrats: numeros.map(contrat),
  pagination: { next, ecartes },
});

const client = () =>
  creerClientDecaBal({ baseURL: `${BAL}/api/`, cle: CLE, delaiNouvelleTentativeMs: 0, delaiRequeteMs: 1_000 });

const lireTout = async (options?: { after?: string; limit?: number }) => {
  const pages: PageContratsDecaBal[] = [];
  for await (const p of lirePagesContratsDeca(client(), options)) {
    pages.push(p);
  }
  return pages;
};

describe("lirePagesContratsDeca", () => {
  beforeAll(() => {
    nock.disableNetConnect();
  });

  afterEach(() => {
    nock.abortPendingRequests();
    nock.cleanAll();
  });

  it("lit les pages jusqu'à next null, avec le bearer, gzip et le curseur", async () => {
    const scope = nock(BAL, { reqheaders: { authorization: `Bearer ${CLE}`, "accept-encoding": /gzip/ } })
      .get("/api/v1/deca/contrats")
      .reply(200, page([1, 2], id(2), 1))
      .get("/api/v1/deca/contrats")
      .query({ after: id(2) })
      .reply(200, page([3], null));

    const pages = await lireTout();

    expect(scope.isDone()).toBe(true);
    expect(pages.map((p) => p.curseur)).toEqual([undefined, id(2)]);
    expect(pages.map((p) => p.contrats.map((c) => c.no_contrat))).toEqual([["C1", "C2"], ["C3"]]);
    expect(pages[0].ecartes).toBe(1);
    expect(pages[0].contrats[0].alternant?.date_naissance).toEqual(new Date("2006-01-01T00:00:00.000Z"));
    expect(pages[0].contrats[0].updated_at).toBeInstanceOf(Date);
  });

  it("continue après une page vide qui n'est pas la dernière", async () => {
    nock(BAL)
      .get("/api/v1/deca/contrats")
      .query({ after: id(1) })
      .reply(200, page([], id(5)))
      .get("/api/v1/deca/contrats")
      .query({ after: id(5) })
      .reply(200, page([6], null));

    const pages = await lireTout({ after: id(1) });

    expect(pages.flatMap((p) => p.contrats.map((c) => c.no_contrat))).toEqual(["C6"]);
  });

  it("rejoue un 403 passager puis lit la page", async () => {
    const scope = nock(BAL)
      .get("/api/v1/deca/contrats")
      .reply(403, { message: "Jeton invalide" })
      .get("/api/v1/deca/contrats")
      .reply(200, page([1], null));

    const pages = await lireTout();

    expect(scope.isDone()).toBe(true);
    expect(pages[0].contrats).toHaveLength(1);
  });

  it("rejoue un délai dépassé puis lit la page", async () => {
    const scope = nock(BAL)
      .get("/api/v1/deca/contrats")
      .delay(300)
      .reply(200, page([9], null))
      .get("/api/v1/deca/contrats")
      .reply(200, page([1], null));
    const clientLent = creerClientDecaBal({
      baseURL: `${BAL}/api/`,
      cle: CLE,
      delaiNouvelleTentativeMs: 0,
      delaiRequeteMs: 100,
    });

    const pages: PageContratsDecaBal[] = [];
    for await (const p of lirePagesContratsDeca(clientLent)) {
      pages.push(p);
    }

    expect(scope.isDone()).toBe(true);
    expect(pages[0].contrats.map((c) => c.no_contrat)).toEqual(["C1"]);
  });

  it("ne rejoue pas un 400", async () => {
    nock(BAL).get("/api/v1/deca/contrats").reply(400, { message: "Paramètre inconnu" });

    await expect(lireTout()).rejects.toMatchObject({ name: "ErreurApiDecaBal", statut: 400 });
    expect(nock.pendingMocks()).toEqual([]);
  });

  it("lève une erreur qui ne porte ni la clé ni la configuration de la requête", async () => {
    nock(BAL).get("/api/v1/deca/contrats").reply(403, { message: "Jeton invalide" });
    const clientSansNouvelleTentative = creerClientDecaBal({ baseURL: `${BAL}/api/`, cle: CLE, tentatives: 0 });

    const erreur = await lirePagesContratsDeca(clientSansNouvelleTentative)
      .next()
      .catch((e: unknown) => e);

    expect(erreur).toBeInstanceOf(ErreurApiDecaBal);
    expect(erreur).toMatchObject({ statut: 403, message: "API DECA de la BAL : réponse 403" });
    expect(JSON.stringify({ error: erreur })).not.toContain(CLE);
    expect(Object.keys(erreur as object)).not.toContain("config");
  });

  it("refuse une réponse au mauvais format", async () => {
    nock(BAL)
      .get("/api/v1/deca/contrats")
      .reply(200, { contrats: [{ ...contrat(1), _id: "pas-un-identifiant" }], pagination: { next: null, ecartes: 0 } });

    await expect(lireTout()).rejects.toThrow();
  });

  it("ne demande jamais plus de 1000 contrats par page, même avec un --limit plus grand", async () => {
    const scope = nock(BAL)
      .get("/api/v1/deca/contrats")
      .query({ limit: 1000 })
      .reply(200, page([1, 2], id(2)))
      .get("/api/v1/deca/contrats")
      .query({ after: id(2), limit: 1000 })
      .reply(200, page([3, 4], null));

    const pages = await lireTout({ limit: 1500 });

    expect(scope.isDone()).toBe(true);
    expect(pages).toHaveLength(2);
  });

  it("demande la page suivante dès qu'il rend la courante", async () => {
    nock(BAL)
      .get("/api/v1/deca/contrats")
      .reply(200, page([1], id(1)));
    const pageSuivante = nock(BAL)
      .get("/api/v1/deca/contrats")
      .query({ after: id(1) })
      .reply(200, page([2], null));
    const pages = lirePagesContratsDeca(client());

    await pages.next();
    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(pageSuivante.isDone()).toBe(true);
    await pages.next();
  });

  it("garde l'échec de la page préchargée pour le consommateur, sans rejet non géré", async () => {
    const rejetsNonGeres: unknown[] = [];
    const ecouteur = (raison: unknown) => rejetsNonGeres.push(raison);
    process.on("unhandledRejection", ecouteur);
    nock(BAL)
      .get("/api/v1/deca/contrats")
      .reply(200, page([1], id(1)))
      .get("/api/v1/deca/contrats")
      .query({ after: id(1) })
      .reply(400, { message: "Paramètre invalide" });

    try {
      const pages = lirePagesContratsDeca(client());
      await pages.next();
      await new Promise((resolve) => setTimeout(resolve, 100));
      await expect(pages.next()).rejects.toMatchObject({ name: "ErreurApiDecaBal", statut: 400 });
    } finally {
      process.off("unhandledRejection", ecouteur);
    }

    expect(rejetsNonGeres).toEqual([]);
  });

  it.each([429, 500, 503])("rejoue une réponse %s puis lit la page", async (statut) => {
    const scope = nock(BAL)
      .get("/api/v1/deca/contrats")
      .reply(statut, { message: "Indisponible" })
      .get("/api/v1/deca/contrats")
      .reply(200, page([1], null));

    const pages = await lireTout();

    expect(scope.isDone()).toBe(true);
    expect(pages[0].contrats).toHaveLength(1);
  });

  it("s'arrête dès que le reste de --limit est lu, sans demander la page suivante", async () => {
    nock(BAL)
      .get("/api/v1/deca/contrats")
      .query({ limit: 2 })
      .reply(200, page([1, 2, 3], id(3)));

    const pages = await lireTout({ limit: 2 });

    expect(pages.flatMap((p) => p.contrats.map((c) => c.no_contrat))).toEqual(["C1", "C2"]);
    expect(nock.pendingMocks()).toEqual([]);
  });
});

describe("lireExpirationCle", () => {
  const jwt = (charge: object) =>
    ["e30", Buffer.from(JSON.stringify(charge)).toString("base64url"), "signature"].join(".");

  it("lit exp sans rien d'autre de la charge", () => {
    expect(lireExpirationCle(jwt({ _id: "x", api_key: "secret", exp: 1_800_000_000 }))).toEqual(
      new Date(1_800_000_000 * 1000)
    );
  });

  it("rend null pour une clé sans exp ou illisible", () => {
    expect(lireExpirationCle(jwt({ _id: "x" }))).toBeNull();
    expect(lireExpirationCle("pas-un-jwt")).toBeNull();
    expect(lireExpirationCle("a.!!!.c")).toBeNull();
  });
});
