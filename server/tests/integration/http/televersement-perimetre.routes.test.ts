import { ObjectId } from "mongodb";
import nock from "nock";
import type { IOrganisationCreate } from "shared/models/data/organisations.model";
import type { IOrganisme } from "shared/models/data/organismes.model";
import { beforeEach, describe, expect, it } from "vitest";

import { effectifsQueueDb, organismesDb } from "@/common/model/collections";
import { createRandomDossierApprenantApiInputV3, createRandomOrganisme } from "@tests/data/randomizedSample";
import { useMongo } from "@tests/jest/setupMongo";
import { useNock } from "@tests/jest/setupNock";
import { initTestApp, RequestAsOrganisationFunc } from "@tests/utils/testUtils";

const API = "https://api.apprentissage.beta.gouv.fr/api";

const IMPORTATEUR = { uai: "0610071W", siret: "77777777200016" };
const TIERS = { uai: "0610077C", siret: "88888888000018" };
const TIERS_API_EN_PANNE = { uai: "0610079E", siret: "99999998000017" };

const organisation: IOrganisationCreate = { type: "ORGANISME_FORMATION", ...IMPORTATEUR };

function mockRechercheExacte({ uai, siret }: { uai: string; siret: string }) {
  nock(API)
    .get("/organisme/v1/recherche")
    .query({ uai, siret })
    .reply(200, {
      metadata: { uai: { status: "ok" }, siret: { status: "ok" } },
      resultat: {
        status: { ouvert: true, declaration_catalogue: true, validation_uai: true },
        correspondances: {
          uai: { lui_meme: true, son_lieu: false },
          siret: { lui_meme: true, son_formateur: false, son_responsable: false },
        },
        organisme: { identifiant: { uai, siret } },
      },
      candidats: [],
    })
    .persist();
}

const dossier = (formateur: { uai: string; siret: string }) =>
  createRandomDossierApprenantApiInputV3({
    etablissement_formateur_uai: formateur.uai,
    etablissement_formateur_siret: formateur.siret,
    etablissement_responsable_uai: IMPORTATEUR.uai,
    etablissement_responsable_siret: IMPORTATEUR.siret,
  });

describe("Périmètre de l'import par fichier", () => {
  useNock();
  useMongo();

  let importateur: IOrganisme;
  let requestAsOrganisation: RequestAsOrganisationFunc;

  beforeEach(async () => {
    const app = await initTestApp();
    requestAsOrganisation = app.requestAsOrganisation;
    importateur = { _id: new ObjectId(), ...createRandomOrganisme({ reseaux: [] }), ...IMPORTATEUR };
    await organismesDb().insertMany([
      importateur,
      { _id: new ObjectId(), ...createRandomOrganisme({ reseaux: [] }), ...TIERS },
      { _id: new ObjectId(), ...createRandomOrganisme({ reseaux: [] }), ...TIERS_API_EN_PANNE },
    ]);
  });

  it("la vérification signale la ligne hors périmètre dans sa cellule", async () => {
    [IMPORTATEUR, TIERS].forEach(mockRechercheExacte);

    const response = await requestAsOrganisation(
      organisation,
      "post",
      `/api/v1/organismes/${importateur._id}/upload/validate`,
      [dossier(IMPORTATEUR), dossier(TIERS)]
    );

    expect(response.status).toBe(200);
    expect(response.data.success).toBe(false);
    expect(response.data.error.issues).toContainEqual({
      path: [1, "etablissement_formateur_uai"],
      message: expect.stringContaining("L'établissement 0610077C n'est pas rattaché à"),
      code: "custom",
    });
    expect(
      response.data.error.issues.filter(
        (issue: { path: unknown[] }) => issue.path[0] === 0 && issue.path[1] === "etablissement_formateur_uai"
      )
    ).toEqual([]);
  });

  it("l'import refuse toute la requête quand une ligne est hors périmètre", async () => {
    [IMPORTATEUR, TIERS].forEach(mockRechercheExacte);

    const response = await requestAsOrganisation(
      organisation,
      "post",
      `/api/v1/organismes/${importateur._id}/upload/import/v3`,
      [dossier(IMPORTATEUR), dossier(TIERS)]
    );

    expect(response.status).toBe(400);
    expect(response.data.message).toContain("L'établissement 0610077C n'est pas rattaché à");
    expect(await effectifsQueueDb().countDocuments({})).toBe(0);
  });

  it("l'import met en file les lignes de l'organisme lui-même", async () => {
    mockRechercheExacte(IMPORTATEUR);

    const response = await requestAsOrganisation(
      organisation,
      "post",
      `/api/v1/organismes/${importateur._id}/upload/import/v3`,
      [dossier(IMPORTATEUR)]
    );

    expect(response.status).toBe(200);
    expect(await effectifsQueueDb().countDocuments({ source_organisme_id: importateur._id.toString() })).toBe(1);
  });

  it("les deux routes répondent 503 quand l'API Alternance est indisponible", async () => {
    nock(API).get("/organisme/v1/recherche").query(true).replyWithError("API indisponible").persist();

    for (const route of ["validate", "import/v3"]) {
      const response = await requestAsOrganisation(
        organisation,
        "post",
        `/api/v1/organismes/${importateur._id}/upload/${route}`,
        [dossier(TIERS_API_EN_PANNE)]
      );

      expect(response.status).toBe(503);
      expect(response.data.message).toBe(
        "La vérification des établissements est momentanément impossible. Réessayez dans quelques minutes. Rien n'a été importé."
      );
    }
    expect(await effectifsQueueDb().countDocuments({})).toBe(0);
  });
});
