import { ObjectId } from "mongodb";
import nock from "nock";
import type { IEffectifDECA } from "shared/models/data/effectifsDECA.model";
import type { IOrganisme } from "shared/models/data/organismes.model";
import { beforeEach, describe, expect, it } from "vitest";

import { verifierPerimetreTeleversement } from "@/common/actions/televersement/perimetre.actions";
import { effectifsDECADb, organismesDb } from "@/common/model/collections";
import { createRandomOrganisme } from "@tests/data/randomizedSample";
import { useMongo } from "@tests/jest/setupMongo";
import { useNock } from "@tests/jest/setupNock";
import { testDoc } from "@tests/utils/testUtils";

const API = "https://api.apprentissage.beta.gouv.fr/api";

type Identifiant = { uai: string; siret: string };

const IMPORTATEUR = { uai: "0600071B", siret: "11111111800019" };
const FORMATEUR_DECLARE = { uai: "0600072C", siret: "22222222600011" };
const MEME_SIRET_QUE_FORMATEUR = { uai: "0600073D", siret: "22222222600011" };
const MEME_SIREN = { uai: "0600074E", siret: "11111111800027" };
const CFA_MEME_SIREN = { uai: "0600075F", siret: "11111111800035" };
const RELIE_PAR_DECA = { uai: "0600076G", siret: "33333333400014" };
const TIERS = { uai: "0600077H", siret: "44444444200016" };
const TIERS_SANS_RESULTAT = { uai: "0600078J", siret: "55555555600011" };
const TIERS_API_EN_PANNE = { uai: "0600079K", siret: "66666666400014" };

function mockRechercheExacte({ uai, siret }: Identifiant) {
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

async function insererOrganisme(identifiant: Identifiant, extra: Partial<IOrganisme> = {}): Promise<IOrganisme> {
  const organisme: IOrganisme = {
    _id: new ObjectId(),
    ...createRandomOrganisme({ reseaux: [] }),
    ...identifiant,
    ...extra,
  };
  await organismesDb().insertOne(organisme);
  return organisme;
}

const ligne = ({ uai, siret }: Identifiant) => ({
  etablissement_formateur_uai: uai,
  etablissement_formateur_siret: siret,
});

describe("verifierPerimetreTeleversement", () => {
  useNock();
  useMongo();

  let importateur: IOrganisme;

  beforeEach(async () => {
    const formateurDeclare = await insererOrganisme(FORMATEUR_DECLARE);
    importateur = await insererOrganisme(IMPORTATEUR, {
      enseigne: "CFA Importateur",
      organismesFormateurs: [{ _id: formateurDeclare._id, ...FORMATEUR_DECLARE }],
    });
    await insererOrganisme(MEME_SIRET_QUE_FORMATEUR);
    await insererOrganisme(MEME_SIREN);
    const cfaMemeSiren = await insererOrganisme(CFA_MEME_SIREN);
    await insererOrganisme(RELIE_PAR_DECA);
    await insererOrganisme(TIERS);
    await effectifsDECADb().insertOne(
      testDoc<IEffectifDECA>({
        _id: new ObjectId(),
        organisme_id: cfaMemeSiren._id,
        annee_scolaire: "2025-2026",
        etablissement_formation_siret: RELIE_PAR_DECA.siret,
      }),
      { bypassDocumentValidation: true }
    );
  });

  it("accepte l'organisme, ses formateurs, leur SIRET, son SIREN et les établissements reliés par DECA", async () => {
    const couples = [IMPORTATEUR, FORMATEUR_DECLARE, MEME_SIRET_QUE_FORMATEUR, MEME_SIREN, RELIE_PAR_DECA];
    couples.forEach(mockRechercheExacte);

    const resultat = await verifierPerimetreTeleversement(importateur._id, couples.map(ligne));

    expect(resultat).toEqual({ indisponible: false, issues: [] });
  });

  it("refuse un établissement sans aucun lien, avec le nom de l'organisme qui importe", async () => {
    [IMPORTATEUR, TIERS].forEach(mockRechercheExacte);

    const resultat = await verifierPerimetreTeleversement(importateur._id, [ligne(IMPORTATEUR), ligne(TIERS)]);

    expect(resultat).toEqual({
      indisponible: false,
      issues: [
        {
          path: [1, "etablissement_formateur_uai"],
          message:
            "L'établissement 0600077H n'est pas rattaché à CFA Importateur. Ses apprenants ne peuvent pas être importés ici.",
          code: "custom",
        },
      ],
    });
  });

  it("n'appelle l'API qu'une fois par couple UAI et SIRET", async () => {
    const appels = { n: 0 };
    nock(API)
      .get("/organisme/v1/recherche")
      .query(true)
      .reply(() => {
        appels.n += 1;
        return [
          200,
          {
            metadata: { uai: { status: "ok" }, siret: { status: "ok" } },
            resultat: null,
            candidats: [],
          },
        ];
      })
      .persist();

    await verifierPerimetreTeleversement(importateur._id, [
      ligne(TIERS_SANS_RESULTAT),
      ligne(TIERS_SANS_RESULTAT),
      ligne(TIERS_SANS_RESULTAT),
    ]);

    expect(appels.n).toBe(1);
  });

  it("signale l'indisponibilité de l'API au lieu de juger le périmètre", async () => {
    nock(API).get("/organisme/v1/recherche").query(true).replyWithError("API indisponible").persist();

    const resultat = await verifierPerimetreTeleversement(importateur._id, [ligne(TIERS_API_EN_PANNE)]);

    expect(resultat).toEqual({ indisponible: true, issues: [] });
  });
});
