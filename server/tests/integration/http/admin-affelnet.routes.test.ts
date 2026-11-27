import { captureException } from "@sentry/node";
import { COLONNES_AFFELNET_CONSERVEES } from "shared/models/data/voeuxAffelnet.model";
import { generateFormationCatalogueFixture } from "shared/models/fixtures/formationsCatalogue.fixture";
import { generateOrganismeFixture } from "shared/models/fixtures/organisme.fixture";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { formationsCatalogueDb, organismesDb, voeuxAffelnetDb } from "@/common/model/collections";
import { AFFELNET_HEADER } from "@/http/routes/admin.routes/affelnet.routes";
import { useMongo } from "@tests/jest/setupMongo";
import { initTestApp, RequestAsOrganisationFunc } from "@tests/utils/testUtils";

vi.mock("@sentry/node", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@sentry/node")>()),
  captureException: vi.fn(),
}));

useMongo();

const URL_IMPORT = "/api/v1/admin/affelnet/create";
const UAI = "0802004U";
const SIRET = "77937827200016";
const CLE = "cle-ministere-educatif";

type Ligne = Record<string, string>;

const ligne = (ine: string, valeurs: Ligne = {}): Ligne => ({
  ine,
  nom: "DUPONT",
  prenom_1: "Jean",
  cle_ministere_educatif: CLE,
  uai_etatblissement_formateur: UAI,
  annee_scolaire_rentree: "2026",
  ...valeurs,
});

let requestAsOrganisation: RequestAsOrganisationFunc;

const importer = (lignes: Ligne[]) => {
  const csv = lignes.map((l) => AFFELNET_HEADER.map((colonne) => l[colonne] ?? "").join(";")).join("\n");
  const formulaire = new FormData();
  formulaire.append("csvfile", new Blob([csv]), "voeux.csv");
  return requestAsOrganisation({ type: "ADMINISTRATEUR" }, "post", URL_IMPORT, formulaire);
};

const voeuDe = (ine: string) => voeuxAffelnetDb().findOne({ "raw.ine": ine });

describe("POST /api/v1/admin/affelnet/create", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  beforeEach(async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-11-19T10:00:00Z"));
    ({ requestAsOrganisation } = await initTestApp());
    await organismesDb().insertOne(generateOrganismeFixture({ uai: UAI, siret: SIRET }));
    await formationsCatalogueDb().insertOne(
      generateFormationCatalogueFixture({
        cle_ministere_educatif: CLE,
        etablissement_gestionnaire_uai: UAI,
        etablissement_gestionnaire_siret: SIRET,
        etablissement_formateur_uai: UAI,
        etablissement_formateur_siret: SIRET,
      })
    );
  });

  it("garde le dernier raw au réimport, sans historique", async () => {
    expect((await importer([ligne("INE1")])).status).toBe(200);
    expect(await voeuDe("INE1")).not.toHaveProperty("history");

    expect((await importer([ligne("INE1", { nom: "DUPOND", ville: "AMIENS" })])).status).toBe(200);

    expect(await voeuxAffelnetDb().countDocuments({})).toBe(1);
    const voeu = await voeuDe("INE1");
    expect(voeu?.raw).toMatchObject({ nom: "DUPOND", ville: "AMIENS" });
    expect(voeu).not.toHaveProperty("history");
    expect(voeu).not.toHaveProperty("deleted_at");
  });

  it("ne garde que les colonnes lues", async () => {
    await importer([ligne("INE1", { telephone_portable: "0612345678", bareme: "120", ville: "AMIENS" })]);

    const voeu = await voeuDe("INE1");
    expect(Object.keys(voeu?.raw ?? {}).sort()).toStrictEqual([...COLONNES_AFFELNET_CONSERVEES].sort());
    expect(voeu?.raw).toMatchObject({ ine: "INE1", ville: "AMIENS" });
  });

  it("ignore les lignes d'une campagne qui n'est plus conservée", async () => {
    expect((await importer([ligne("INE1", { annee_scolaire_rentree: "2024" }), ligne("INE2")])).status).toBe(200);

    expect(await voeuDe("INE1")).toBeNull();
    expect(await voeuDe("INE2")).not.toBeNull();
  });

  it("refuse un fichier qui ne porte que des campagnes non conservées", async () => {
    const response = await importer([ligne("INE1", { annee_scolaire_rentree: "2024" })]);

    expect(response.status).toBe(400);
    expect(response.data.message).toBe("Aucune ligne d'une campagne conservée, à partir de 2025.");
    expect(captureException).not.toHaveBeenCalled();
    expect(await voeuxAffelnetDb().countDocuments({})).toBe(0);
  });

  it("retire deleted_at d'un vœu supprimé puis réimporté", async () => {
    await importer([ligne("INE1"), ligne("INE2")]);
    vi.setSystemTime(new Date("2026-11-19T11:00:00Z"));
    await importer([ligne("INE2")]);
    expect((await voeuDe("INE1"))?.deleted_at).toBeInstanceOf(Date);

    vi.setSystemTime(new Date("2026-11-19T12:00:00Z"));
    await importer([ligne("INE1")]);

    expect(await voeuDe("INE1")).not.toHaveProperty("deleted_at");
  });
});
