import { normalize } from "path";

import { captureMessage, setMeasurement } from "@sentry/node";
import { ObjectId } from "bson";
import { addJob } from "job-processor";
import nock from "nock";
import { cyrb53Hash } from "shared/utils";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { apiAlternanceClient } from "@/common/apis/apiAlternance/client";
import { effectifsDECADb, organismesDb, voeuxAffelnetDb } from "@/common/model/collections";
import { createIndexes } from "@/common/model/indexes";
import config from "@/config";
import { estContratEcarte, hydrateDecaRaw } from "@/jobs/hydrate/deca/hydrate-deca-raw";
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
    vi.mocked(addJob).mockClear();
    await organismesDb().insertOne({ _id: new ObjectId(), ...createRandomOrganisme({ uai: UAI, siret: SIRET }) });
  });

  afterEach(() => {
    nock.cleanAll();
  });

  it("crée l'effectif depuis un contrat de la route, avec les mêmes clés qu'à la lecture Mongo", async () => {
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

    it("prévient Sentry à moins de 30 jours de l'échéance, sans le secret", async () => {
      config.bal.deca_api_key = jwt(dans(10));
      bal().reply(200, { contrats: [], pagination: { next: null, ecartes: 0 } });

      await hydrateDecaRaw();

      expect(captureMessage).toHaveBeenCalledWith(
        "La clé de l'API DECA de la BAL expire bientôt",
        expect.objectContaining({ fingerprint: ["deca-bal-cle-expiration"] })
      );
      expect(JSON.stringify(vi.mocked(captureMessage).mock.calls)).not.toContain("secret");
    });

    it("ne prévient pas plus de 30 jours avant l'échéance", async () => {
      config.bal.deca_api_key = jwt(dans(60));
      bal().reply(200, { contrats: [], pagination: { next: null, ecartes: 0 } });

      await hydrateDecaRaw();

      expect(captureMessage).not.toHaveBeenCalled();
    });
  });

  it("compte un échec pour un contrat sans alternant et signale les contrats écartés par la BAL", async () => {
    bal().reply(200, { contrats: [contratBal({ alternant: null })], pagination: { next: null, ecartes: 2 } });

    await hydrateDecaRaw();

    expect(await effectifsDECADb().countDocuments()).toBe(0);
    expect(mesures()).toMatchObject({ "deca.contrats": 1, "deca.effectifs": 0, "deca.echecs": 1, "deca.ecartes": 2 });
    expect(captureMessage).toHaveBeenCalledWith("Contrats DECA écartés par la BAL", expect.anything());
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

  describe("contrats annulés et supprimés", () => {
    const page = (contrats: unknown[]) => ({ contrats, pagination: { next: null, ecartes: 0 } });
    const voeuLie = (effectifDecaId: ObjectId) => ({
      _id: new ObjectId(),
      effectif_deca_id: effectifDecaId,
      created_at: new Date(),
      updated_at: new Date(),
      is_contacted: false,
      raw: {},
      history: [],
      _computed: { formation: {} },
    });

    it.each(["Annulé", "Supprimé", " SUPPRIME "])(
      "écarte un contrat au statut %s, ses copies fléchées et le lien de son vœu",
      async (statut) => {
        const contrat = contratBal();
        const autre = contratBal({ alternant: { ...contratBal().alternant, nom: "MARTIN" } });
        bal().reply(200, page([contrat, autre]));
        await hydrateDecaRaw();

        const effectif = await effectifsDECADb().findOne({ deca_raw_id: new ObjectId(contrat._id) });
        const autreEffectif = await effectifsDECADb().findOne({ deca_raw_id: new ObjectId(autre._id) });
        await effectifsDECADb().insertOne({
          ...effectif!,
          _id: new ObjectId(),
          organisme_id: new ObjectId(),
          fleche: { regle: "lieu_declare", le: new Date() },
        });
        await effectifsDECADb().updateOne(
          { _id: effectif!._id },
          { $set: { fleche: { regle: "lieu_declare", le: new Date(), annule_le: new Date() } } }
        );
        const voeu = await voeuxAffelnetDb().insertOne(voeuLie(effectif!._id));
        const voeuAutre = await voeuxAffelnetDb().insertOne(voeuLie(autreEffectif!._id));
        vi.mocked(setMeasurement).mockClear();

        bal().reply(200, page([{ ...contrat, statut }, autre]));
        await hydrateDecaRaw();

        expect(await effectifsDECADb().countDocuments({ deca_raw_id: new ObjectId(contrat._id) })).toBe(0);
        expect(await effectifsDECADb().countDocuments({ deca_raw_id: new ObjectId(autre._id) })).toBe(1);
        expect((await voeuxAffelnetDb().findOne({ _id: voeu.insertedId }))?.effectif_deca_id).toBeUndefined();
        expect((await voeuxAffelnetDb().findOne({ _id: voeuAutre.insertedId }))?.effectif_deca_id).toEqual(
          autreEffectif!._id
        );
        expect(mesures()).toMatchObject({ "deca.annules": 2 });
      }
    );

    it("garde l'effectif écrit en dernier par un autre contrat du même apprenant", async () => {
      const ancien = contratBal();
      const nouveau = contratBal();
      bal().reply(200, page([ancien]));
      await hydrateDecaRaw();

      bal().reply(200, page([{ ...ancien, statut: "Annulé" }, nouveau]));
      await hydrateDecaRaw();

      const effectifs = await effectifsDECADb().find({}).toArray();
      expect(effectifs).toHaveLength(1);
      expect(effectifs[0].deca_raw_id).toEqual(new ObjectId(nouveau._id));
    });

    it("garde les effectifs des contrats annulés lors d'un import partiel", async () => {
      const contrat = contratBal();
      bal().reply(200, page([contrat]));
      await hydrateDecaRaw();

      nock("https://bal.test")
        .get("/api/v1/deca/contrats")
        .query({ limit: 1 })
        .reply(200, page([{ ...contrat, statut: "Annulé" }]));
      await hydrateDecaRaw({ limit: 1 });

      expect(await effectifsDECADb().countDocuments({ deca_raw_id: new ObjectId(contrat._id) })).toBe(1);
    });

    it("ne crée rien pour un contrat annulé jamais importé", async () => {
      bal().reply(200, page([contratBal({ statut: "Annulé" })]));

      await hydrateDecaRaw();

      expect(await effectifsDECADb().countDocuments()).toBe(0);
      expect(mesures()).toMatchObject({ "deca.annules": 0 });
    });

    it("ne supprime rien quand la lecture est interrompue", async () => {
      const contrat = contratBal();
      bal().reply(200, page([contrat]));
      await hydrateDecaRaw();

      const curseur = new ObjectId().toHexString();
      bal()
        .reply(200, { contrats: [{ ...contrat, statut: "Annulé" }], pagination: { next: curseur, ecartes: 0 } })
        .get("/api/v1/deca/contrats")
        .query({ after: curseur })
        .reply(400, { message: "Paramètre invalide" });

      await expect(hydrateDecaRaw()).rejects.toMatchObject({ name: "ErreurApiDecaBal", statut: 400 });

      expect(await effectifsDECADb().countDocuments({ deca_raw_id: new ObjectId(contrat._id) })).toBe(1);
    });

    it("reconnaît les statuts écartés", () => {
      expect(estContratEcarte({ statut: "Annulé" })).toBe(true);
      expect(estContratEcarte({ statut: " annule" })).toBe(true);
      expect(estContratEcarte({ statut: "Supprimé" })).toBe(true);
      expect(estContratEcarte({ statut: "Corrigé" })).toBe(false);
      expect(estContratEcarte({ statut: "Rompu" })).toBe(false);
      expect(estContratEcarte({ statut: "" })).toBe(false);
      expect(estContratEcarte({ statut: null })).toBe(false);
    });
  });
});
