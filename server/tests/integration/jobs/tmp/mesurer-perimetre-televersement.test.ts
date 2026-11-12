import { ObjectId } from "mongodb";
import nock from "nock";
import { SOURCE_APPRENANT } from "shared/constants";
import type { IEffectifQueue } from "shared/models/data/effectifsQueue.model";
import type { IOrganisme } from "shared/models/data/organismes.model";
import { beforeEach, describe, expect, it } from "vitest";

import { effectifsQueueDb, organismesDb } from "@/common/model/collections";
import { mesurerPerimetreTeleversement } from "@/jobs/tmp/mesurer-perimetre-televersement";
import { createRandomOrganisme } from "@tests/data/randomizedSample";
import { useMongo } from "@tests/jest/setupMongo";
import { useNock } from "@tests/jest/setupNock";

const API = "https://api.apprentissage.beta.gouv.fr/api";

const IMPORTATEUR = { uai: "0600071B", siret: "11111111800019" };
const TIERS = { uai: "0600077H", siret: "44444444200016" };

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

const ligne = (formateur: { uai: string; siret: string }, sourceOrganismeId: string, created_at: Date) =>
  ({
    _id: new ObjectId(),
    source: SOURCE_APPRENANT.FICHIER,
    source_organisme_id: sourceOrganismeId,
    etablissement_formateur_uai: formateur.uai,
    etablissement_formateur_siret: formateur.siret,
    created_at,
  }) as IEffectifQueue;

describe("tmp:mesurer-perimetre-televersement", () => {
  useNock();
  useMongo();

  let importateur: IOrganisme;

  beforeEach(async () => {
    importateur = { _id: new ObjectId(), ...createRandomOrganisme({ reseaux: [] }), ...IMPORTATEUR };
    await organismesDb().insertMany([
      importateur,
      { _id: new ObjectId(), ...createRandomOrganisme({ reseaux: [] }), ...TIERS },
    ]);
    [IMPORTATEUR, TIERS].forEach(mockRechercheExacte);
  });

  it("compte les imports qui seraient refusés, par organisme et par jour", async () => {
    const source = importateur._id.toString();
    const jourAccepte = new Date("2026-10-01T10:00:00Z");
    const jourRefuse = new Date("2026-10-02T10:00:00Z");
    await effectifsQueueDb().insertMany(
      [
        ligne(IMPORTATEUR, source, jourAccepte),
        ligne(IMPORTATEUR, source, jourAccepte),
        ligne(IMPORTATEUR, source, jourRefuse),
        ligne(TIERS, source, jourRefuse),
        ligne(TIERS, source, jourRefuse),
      ],
      { bypassDocumentValidation: true }
    );

    const bilan = await mesurerPerimetreTeleversement({ mois: 600 });

    expect(bilan).toMatchObject({
      imports: 2,
      lignes: 5,
      importsNonJuges: [],
      importsRefuses: [
        {
          source_organisme_id: source,
          uai_source: IMPORTATEUR.uai,
          jour: "2026-10-02",
          lignes: 3,
          lignes_hors_perimetre: 2,
          etablissements_hors_perimetre: [`${TIERS.uai} ${TIERS.siret}`],
        },
      ],
    });
  });
});
