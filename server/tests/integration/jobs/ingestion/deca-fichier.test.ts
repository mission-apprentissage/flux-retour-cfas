import { ObjectId } from "mongodb";
import nock from "nock";
import { CODES_STATUT_APPRENANT, SOURCE_APPRENANT } from "shared";
import type { IEffectifDECA } from "shared/models/data/effectifsDECA.model";
import type { IEffectifQueue } from "shared/models/data/effectifsQueue.model";
import type { IOrganisme } from "shared/models/data/organismes.model";
import { beforeEach, describe, expect, it } from "vitest";

import { effectifsDECADb, effectifsQueueDb, organismesDb } from "@/common/model/collections";
import { processEffectifsQueue } from "@/jobs/ingestion/process-ingestion";
import { mockApiApprentissageCertificationApi } from "@tests/data/api.apprentissage.beta.gouv.fr/certification/apiApprentissage.certification.mock";
import { createRandomOrganisme } from "@tests/data/randomizedSample";
import { useMongo } from "@tests/jest/setupMongo";
import { useNock } from "@tests/jest/setupNock";
import { testDoc } from "@tests/utils/testUtils";

const API = "https://api.apprentissage.beta.gouv.fr/api";
const LEMONNIER = { uai: "0141866C", siret: "78071394700015" };

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

function dossier(source: IEffectifQueue["source"], sourceOrganismeId: string): IEffectifQueue {
  return {
    _id: new ObjectId(),
    nom_apprenant: "Doe",
    prenom_apprenant: "Jane",
    date_de_naissance_apprenant: "2004-05-06T00:00:00.000Z",
    annee_scolaire: "2021-2022",
    statut_apprenant: CODES_STATUT_APPRENANT.inscrit,
    date_metier_mise_a_jour_statut: "2022-12-28T04:05:47.647Z",
    id_erp_apprenant: "42",
    api_version: "v3",
    annee_formation: 1,
    formation_rncp: "RNCP5364",
    date_inscription_formation: "2021-09-01T00:00:00.000Z",
    date_entree_formation: "2021-09-01T00:00:00.000Z",
    date_fin_formation: "2022-06-30T00:00:00.000Z",
    duree_theorique_formation_mois: 24,
    etablissement_responsable_uai: LEMONNIER.uai,
    etablissement_responsable_siret: LEMONNIER.siret,
    etablissement_formateur_uai: LEMONNIER.uai,
    etablissement_formateur_siret: LEMONNIER.siret,
    etablissement_lieu_de_formation_uai: LEMONNIER.uai,
    etablissement_lieu_de_formation_siret: LEMONNIER.siret,
    created_at: new Date(),
    source,
    source_organisme_id: sourceOrganismeId,
  };
}

describe("Mécanisme DECA à l'ingestion", () => {
  useNock();
  useMongo();

  let lemonnier: IOrganisme;
  let contratDecaId: ObjectId;

  beforeEach(async () => {
    lemonnier = {
      _id: new ObjectId(),
      ...createRandomOrganisme({ reseaux: [] }),
      ...LEMONNIER,
      is_transmission_target: false,
    };
    await organismesDb().insertOne(lemonnier);
    contratDecaId = new ObjectId();
    await effectifsDECADb().insertOne(
      testDoc<IEffectifDECA>({
        _id: contratDecaId,
        organisme_id: lemonnier._id,
        annee_scolaire: "2021-2022",
        is_deca_compatible: true,
      }),
      { bypassDocumentValidation: true }
    );
    mockApiApprentissageCertificationApi();
    mockRechercheExacte(LEMONNIER);
  });

  it("un import par fichier ne fait pas sortir l'organisme de DECA", async () => {
    await effectifsQueueDb().insertOne(dossier(SOURCE_APPRENANT.FICHIER, lemonnier._id.toString()));

    await processEffectifsQueue();

    expect((await organismesDb().findOne({ _id: lemonnier._id }))?.is_transmission_target).toBe(false);
    expect((await effectifsDECADb().findOne({ _id: contratDecaId }))?.is_deca_compatible).toBe(true);
  });

  it("un envoi ERP fait toujours sortir l'organisme de DECA", async () => {
    await effectifsQueueDb().insertOne(dossier(SOURCE_APPRENANT.ERP, lemonnier._id.toString()));

    await processEffectifsQueue();

    expect((await organismesDb().findOne({ _id: lemonnier._id }))?.is_transmission_target).toBe(true);
    expect((await effectifsDECADb().findOne({ _id: contratDecaId }))?.is_deca_compatible).toBe(false);
  });
});
