import { generateFormationCatalogueFixture } from "shared/models/fixtures/formationsCatalogue.fixture";
import { generateOrganismeFixture } from "shared/models/fixtures/organisme.fixture";
import { beforeEach, describe, expect, it } from "vitest";

import { formationsCatalogueDb, organismesDb, voeuxAffelnetDb } from "@/common/model/collections";
import { AFFELNET_HEADER } from "@/http/routes/admin.routes/affelnet.routes";
import { useMongo } from "@tests/jest/setupMongo";
import { initTestApp, RequestAsOrganisationFunc } from "@tests/utils/testUtils";

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
  rang: "1",
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
  beforeEach(async () => {
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

    expect((await importer([ligne("INE1", { nom: "DUPOND", rang: "2" })])).status).toBe(200);

    expect(await voeuxAffelnetDb().countDocuments({})).toBe(1);
    const voeu = await voeuDe("INE1");
    expect(voeu?.raw).toMatchObject({ nom: "DUPOND", rang: "2" });
    expect(voeu).not.toHaveProperty("history");
    expect(voeu).not.toHaveProperty("deleted_at");
  });

  it("retire deleted_at d'un vœu supprimé puis réimporté", async () => {
    await importer([ligne("INE1"), ligne("INE2")]);
    await importer([ligne("INE2")]);
    expect((await voeuDe("INE1"))?.deleted_at).toBeInstanceOf(Date);

    await importer([ligne("INE1")]);

    expect(await voeuDe("INE1")).not.toHaveProperty("deleted_at");
  });
});
