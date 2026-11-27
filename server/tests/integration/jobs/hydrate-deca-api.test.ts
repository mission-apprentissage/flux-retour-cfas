import { normalize } from "path";

import { captureException, captureMessage, setMeasurement } from "@sentry/node";
import { ObjectId } from "bson";
import { addJob } from "job-processor";
import nock from "nock";
import { cyrb53Hash } from "shared/utils";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { withStatsMlDifferees } from "@/common/actions/mission-locale/statsMlDifferees";
import { apiAlternanceClient } from "@/common/apis/apiAlternance/client";
import parentLogger from "@/common/logger";
import { effectifsDECADb, organismesDb } from "@/common/model/collections";
import { createIndexes } from "@/common/model/indexes";
import config from "@/config";
import { hydrateDecaRaw } from "@/jobs/hydrate/deca/hydrate-deca-raw";
import { createRandomOrganisme } from "@tests/data/randomizedSample";
import { useMongo } from "@tests/jest/setupMongo";

vi.mock("job-processor", async (importOriginal) => ({
  ...(await importOriginal<typeof import("job-processor")>()),
  addJob: vi.fn(),
}));

vi.mock("@sentry/node", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@sentry/node")>()),
  captureException: vi.fn(),
  captureMessage: vi.fn(),
  setMeasurement: vi.fn(),
}));

vi.mock("@/common/actions/mission-locale/statsMlDifferees", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/common/actions/mission-locale/statsMlDifferees")>();
  return { ...actual, withStatsMlDifferees: vi.fn(actual.withStatsMlDifferees) };
});

vi.mock("@/common/apis/apiAlternance/client", () => ({
  apiAlternanceClient: {
    certification: { index: vi.fn().mockResolvedValue([]) },
    geographie: { rechercheCommune: vi.fn().mockResolvedValue([]) },
  },
}));

const UAI = "0802004U";
const SIRET = "77937827200016";
const DATE_NAISSANCE = "2006-01-01T00:00:00.000Z";

const contratBal = (overrides: Record<string, unknown> = {}) => ({
  _id: new ObjectId().toHexString(),
  updated_at: "2026-11-20T00:00:00.000Z",
  no_contrat: "C1",
  type_contrat: "11",
  statut: null,
  type_employeur: 12,
  date_debut_contrat: "2025-09-01T00:00:00.000Z",
  date_fin_contrat: "2027-06-30T00:00:00.000Z",
  date_effet_rupture: null,
  alternant: {
    nom: "DUPONT",
    prenom: "Jean",
    sexe: "H",
    courriel: "jean.dupont@example.com",
    telephone: "0612345678",
    date_naissance: DATE_NAISSANCE,
    nationalite: 1,
    handicap: false,
    derniere_classe: 1,
    adresse: { numero: "3", voie: "RUE DE LA PAIX", code_postal: "75002" },
  },
  formation: {
    date_debut_formation: "2025-09-01T00:00:00.000Z",
    date_fin_formation: "2026-06-30T00:00:00.000Z",
    code_diplome: "50022137",
    rncp: "RNCP12345",
    intitule_ou_qualification: "CAP CUISINE",
  },
  employeur: {
    siret: "12345678901234",
    denomination: "RESTAURANT",
    naf: "5610A",
    nombre_de_salaries: 5,
    adresse: { code_postal: "75002" },
  },
  organisme_formation: { siret: SIRET, uai_cfa: UAI },
  etablissement_formation: { siret: SIRET },
  ...overrides,
});

const bal = () => nock("https://bal.test").get("/api/v1/deca/contrats");

const mesures = () => Object.fromEntries(vi.mocked(setMeasurement).mock.calls.map(([nom, valeur]) => [nom, valeur]));

describe("import DECA par l'API de la BAL", () => {
  useMongo();

  beforeAll(async () => {
    await createIndexes();
    nock.disableNetConnect();
    nock.enableNetConnect(/127\.0\.0\.1|localhost/);
  });

  beforeEach(async () => {
    vi.mocked(setMeasurement).mockClear();
    vi.mocked(captureMessage).mockClear();
    vi.mocked(captureException).mockClear();
    vi.mocked(addJob).mockClear();
    vi.mocked(withStatsMlDifferees).mockClear();
    await organismesDb().insertOne({ _id: new ObjectId(), ...createRandomOrganisme({ uai: UAI, siret: SIRET }) });
  });

  afterEach(() => {
    nock.cleanAll();
  });

  it("crée l'effectif depuis un contrat de la route, avec un identifiant calculé sur la date de naissance en Date", async () => {
    const contrat = contratBal();
    bal().reply(200, { contrats: [contrat], pagination: { next: null, ecartes: 0 } });

    await hydrateDecaRaw();

    const effectifs = await effectifsDECADb().find({}).toArray();
    expect(effectifs).toHaveLength(1);
    const [effectif] = effectifs;
    expect(effectif.deca_raw_id).toEqual(new ObjectId(contrat._id));
    expect(effectif.annee_scolaire).toBe("2025-2026");
    expect(effectif.apprenant.date_de_naissance).toEqual(new Date(DATE_NAISSANCE));
    expect(effectif.contrats?.[0].date_debut).toEqual(new Date("2025-09-01T00:00:00.000Z"));
    expect(effectif.contrats?.[0].type_employeur).toBe(12);
    expect(effectif.formation?.date_fin).toEqual(new Date("2026-06-30T00:00:00.000Z"));
    expect(effectif.id_erp_apprenant).toBe(
      cyrb53Hash(normalize("Jean").trim() + normalize("DUPONT").trim() + new Date(DATE_NAISSANCE))
    );
    expect(effectif.id_erp_apprenant).not.toBe(
      cyrb53Hash(normalize("Jean").trim() + normalize("DUPONT").trim() + DATE_NAISSANCE)
    );
    expect(mesures()).toMatchObject({ "deca.contrats": 1, "deca.effectifs": 1, "deca.echecs": 0, "deca.ecartes": 0 });
  });

  it("écrit en dernier le contrat le plus récent d'un même apprenant, même si l'ancien est plus lent", async () => {
    const ancien = contratBal();
    const recent = contratBal({ formation: { ...contratBal().formation, code_diplome: "50022138" } });
    vi.mocked(apiAlternanceClient.certification.index).mockImplementation(async ({ identifiant }) => {
      if (identifiant && "cfd" in identifiant && identifiant.cfd === "50022137") {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
      return [];
    });
    bal().reply(200, { contrats: [ancien, recent], pagination: { next: null, ecartes: 0 } });

    try {
      await hydrateDecaRaw();
    } finally {
      vi.mocked(apiAlternanceClient.certification.index).mockResolvedValue([]);
    }

    const effectifs = await effectifsDECADb().find({}).toArray();
    expect(effectifs).toHaveLength(1);
    expect(effectifs[0].deca_raw_id).toEqual(new ObjectId(recent._id));
    expect(effectifs[0].formation?.cfd).toBe("50022138");
  });

  it("met type_employeur à null pour un code hors de l'énumération", async () => {
    bal().reply(200, { contrats: [contratBal({ type_employeur: 99 })], pagination: { next: null, ecartes: 0 } });

    await hydrateDecaRaw();

    const effectif = await effectifsDECADb().findOne({});
    expect(effectif?.contrats?.[0].type_employeur).toBeNull();
  });

  it("ne compte pas d'échec pour un contrat incomplet chez un organisme inconnu, comme avant", async () => {
    const alternantSansAdresse = { ...contratBal().alternant, adresse: null };
    bal().reply(200, {
      contrats: [
        contratBal({
          alternant: alternantSansAdresse,
          organisme_formation: { siret: "11111111111111", uai_cfa: "1111111A" },
        }),
        contratBal({ alternant: alternantSansAdresse }),
      ],
      pagination: { next: null, ecartes: 0 },
    });

    await hydrateDecaRaw();

    expect(mesures()).toMatchObject({ "deca.contrats": 2, "deca.echecs": 1, "deca.effectifs": 0 });
  });

  describe("échéance de la clé", () => {
    const cleInitiale = config.bal.deca_api_key;
    const jwt = (exp: number) =>
      ["e30", Buffer.from(JSON.stringify({ _id: "x", api_key: "secret", exp })).toString("base64url"), "s"].join(".");
    const dans = (jours: number) => Math.floor(Date.now() / 1000) + jours * 86_400;

    afterEach(() => {
      config.bal.deca_api_key = cleInitiale;
    });

    it("prévient Sentry à moins de 30 jours de l'échéance, avec la seule date", async () => {
      const cle = jwt(dans(29));
      config.bal.deca_api_key = cle;
      bal().reply(200, { contrats: [], pagination: { next: null, ecartes: 0 } });

      await hydrateDecaRaw();

      const date = new Date(dans(29) * 1000).toISOString().slice(0, 10);
      expect(captureMessage).toHaveBeenCalledWith("La clé de l'API DECA de la BAL expire bientôt", {
        level: "warning",
        fingerprint: ["deca-bal-cle-expiration"],
        extra: { expiration: date },
      });
      expect(JSON.stringify(vi.mocked(captureMessage).mock.calls)).not.toContain(cle.split(".")[1]);
    });

    it("ne prévient pas plus de 30 jours avant l'échéance", async () => {
      config.bal.deca_api_key = jwt(dans(31));
      bal().reply(200, { contrats: [], pagination: { next: null, ecartes: 0 } });

      await hydrateDecaRaw();

      expect(captureMessage).not.toHaveBeenCalled();
    });
  });

  it("cumule les contrats écartés par la BAL sur toutes les pages, et compte les mises à jour", async () => {
    const contrat = contratBal();
    const curseur = new ObjectId().toHexString();
    bal().reply(200, { contrats: [contrat], pagination: { next: null, ecartes: 0 } });
    await hydrateDecaRaw();
    vi.mocked(setMeasurement).mockClear();

    bal()
      .reply(200, { contrats: [contrat], pagination: { next: curseur, ecartes: 1 } })
      .get("/api/v1/deca/contrats")
      .query({ after: curseur })
      .reply(200, { contrats: [], pagination: { next: null, ecartes: 2 } });
    await hydrateDecaRaw();

    expect(mesures()).toMatchObject({ "deca.ecartes": 3, "deca.effectifs": 1 });
  });

  it("journalise le curseur de la dernière page lue quand une page suivante échoue", async () => {
    const journal = vi.spyOn(Object.getPrototypeOf(parentLogger), "error");
    const [x, y, z] = [new ObjectId(), new ObjectId(), new ObjectId()].map((id) => id.toHexString());
    nock("https://bal.test")
      .get("/api/v1/deca/contrats")
      .query({ after: x })
      .reply(200, { contrats: [contratBal()], pagination: { next: y, ecartes: 0 } })
      .get("/api/v1/deca/contrats")
      .query({ after: y })
      .reply(200, { contrats: [contratBal()], pagination: { next: z, ecartes: 0 } })
      .get("/api/v1/deca/contrats")
      .query({ after: z })
      .reply(400, {});

    try {
      await expect(hydrateDecaRaw({ after: x })).rejects.toMatchObject({ statut: 400 });
      expect(journal).toHaveBeenCalledWith(
        expect.objectContaining({ reprise: y }),
        "DECA : import interrompu, reprendre avec --after"
      );
    } finally {
      journal.mockRestore();
    }
  });

  it("journalise le curseur de départ quand la première page d'une reprise échoue", async () => {
    const journal = vi.spyOn(Object.getPrototypeOf(parentLogger), "error");
    const curseur = new ObjectId().toHexString();
    nock("https://bal.test").get("/api/v1/deca/contrats").query({ after: curseur }).reply(400, {});

    try {
      await expect(hydrateDecaRaw({ after: curseur })).rejects.toMatchObject({ statut: 400 });
      expect(journal).toHaveBeenCalledWith(
        expect.objectContaining({ reprise: curseur }),
        "DECA : import interrompu, reprendre avec --after"
      );
    } finally {
      journal.mockRestore();
    }
  });

  it("compte un échec pour un contrat sans alternant et signale les contrats écartés par la BAL", async () => {
    bal().reply(200, { contrats: [contratBal({ alternant: null })], pagination: { next: null, ecartes: 2 } });

    await hydrateDecaRaw();

    expect(await effectifsDECADb().countDocuments()).toBe(0);
    expect(mesures()).toMatchObject({ "deca.contrats": 1, "deca.effectifs": 0, "deca.echecs": 1, "deca.ecartes": 2 });
    expect(captureMessage).toHaveBeenCalledWith("Contrats DECA écartés par la BAL", expect.anything());
    const agrege = vi
      .mocked(captureException)
      .mock.calls.map(([erreur]) => erreur)
      .find((erreur) => erreur instanceof Error && erreur.message.includes("échecs agrégés")) as Error | undefined;
    expect((agrege?.cause as Error | undefined)?.message).toBe("Contrat DECA incomplet : alternant absent");
  });

  it("lève sur une lecture interrompue, sans publier de mesures", async () => {
    const curseur = new ObjectId().toHexString();
    bal()
      .reply(200, { contrats: [contratBal()], pagination: { next: curseur, ecartes: 0 } })
      .get("/api/v1/deca/contrats")
      .query({ after: curseur })
      .reply(400, { message: "Paramètre invalide" });

    await expect(hydrateDecaRaw()).rejects.toMatchObject({ name: "ErreurApiDecaBal", statut: 400 });

    expect(await effectifsDECADb().countDocuments()).toBe(1);
    expect(setMeasurement).not.toHaveBeenCalled();
    expect(addJob).not.toHaveBeenCalled();
    expect(withStatsMlDifferees).toHaveBeenCalledTimes(1);
  });

  it("reprend après --after normalisé en minuscules, sans publier de mesures", async () => {
    const curseur = new ObjectId().toHexString();
    const scope = nock("https://bal.test")
      .get("/api/v1/deca/contrats")
      .query({ after: curseur })
      .reply(200, { contrats: [contratBal()], pagination: { next: null, ecartes: 0 } });

    await hydrateDecaRaw({ after: curseur.toUpperCase() });

    expect(scope.isDone()).toBe(true);
    expect(await effectifsDECADb().countDocuments()).toBe(1);
    expect(setMeasurement).not.toHaveBeenCalled();
  });

  it.each(["Annulé", "Corrigé", "Rompu", "Supprimé"])(
    "importe un contrat au statut %s comme les autres",
    async (statut) => {
      const contrat = contratBal();
      bal().reply(200, { contrats: [contrat], pagination: { next: null, ecartes: 0 } });
      await hydrateDecaRaw();

      bal().reply(200, { contrats: [{ ...contrat, statut }], pagination: { next: null, ecartes: 0 } });
      await hydrateDecaRaw();

      expect(await effectifsDECADb().countDocuments({ deca_raw_id: new ObjectId(contrat._id) })).toBe(1);
      expect(mesures()).toMatchObject({ "deca.contrats": 1, "deca.effectifs": 1, "deca.echecs": 0 });
    }
  );
});
