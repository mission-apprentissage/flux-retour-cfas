import { ObjectId } from "mongodb";
import nock from "nock";
import { SOURCE_APPRENANT } from "shared";
import type { IEffectifQueue } from "shared/models/data/effectifsQueue.model";
import type { IOrganisme } from "shared/models/data/organismes.model";
import { beforeEach, describe, expect, it } from "vitest";

import { effectifsQueueDb, organismesDb } from "@/common/model/collections";
import { processEffectifsQueue } from "@/jobs/ingestion/process-ingestion";
import { createRandomOrganisme } from "@tests/data/randomizedSample";
import { useMongo } from "@tests/jest/setupMongo";
import { useNock } from "@tests/jest/setupNock";

const API = "https://api.apprentissage.beta.gouv.fr/api";
const INCONNU = { uai: "0141867D", siret: "78071394700023" };

function ligneSansOrganisme(source: IEffectifQueue["source"], sourceOrganismeId: string): IEffectifQueue {
  return {
    _id: new ObjectId(),
    nom_apprenant: "Doe",
    prenom_apprenant: "Jane",
    date_de_naissance_apprenant: "2004-05-06T00:00:00.000Z",
    annee_scolaire: "2025-2026",
    id_erp_apprenant: "42",
    api_version: "v3",
    formation_rncp: "RNCP5364",
    date_inscription_formation: "2025-09-01T00:00:00.000Z",
    date_entree_formation: "2025-09-01T00:00:00.000Z",
    date_fin_formation: "2026-06-30T00:00:00.000Z",
    etablissement_responsable_uai: INCONNU.uai,
    etablissement_responsable_siret: INCONNU.siret,
    etablissement_formateur_uai: INCONNU.uai,
    etablissement_formateur_siret: INCONNU.siret,
    created_at: new Date(),
    source,
    source_organisme_id: sourceOrganismeId,
  };
}

describe("Alerte d'erreurs de transmission", () => {
  useNock();
  useMongo();

  let importateur: IOrganisme;

  beforeEach(async () => {
    importateur = { _id: new ObjectId(), ...createRandomOrganisme({ reseaux: [] }), has_transmission_errors: false };
    await organismesDb().insertOne(importateur);
    nock(API)
      .get("/organisme/v1/recherche")
      .query(true)
      .reply(200, { metadata: { uai: { status: "ok" }, siret: { status: "ok" } }, resultat: null, candidats: [] })
      .persist();
  });

  it("une ligne de fichier rejetée au traitement allume l'alerte de l'organisme qui a importé", async () => {
    await effectifsQueueDb().insertOne(ligneSansOrganisme(SOURCE_APPRENANT.FICHIER, importateur._id.toString()));

    await processEffectifsQueue();

    expect(await effectifsQueueDb().findOne({})).toMatchObject({ has_error: true });
    expect(await organismesDb().findOne({ _id: importateur._id })).toMatchObject({
      has_transmission_errors: true,
      transmission_errors_date: expect.any(Date),
    });
  });

  it("une ligne d'ERP rejetée au traitement ne change pas l'alerte", async () => {
    await effectifsQueueDb().insertOne(ligneSansOrganisme(SOURCE_APPRENANT.ERP, importateur._id.toString()));

    await processEffectifsQueue();

    expect(await effectifsQueueDb().findOne({})).toMatchObject({ has_error: true });
    expect(await organismesDb().findOne({ _id: importateur._id })).toMatchObject({ has_transmission_errors: false });
  });
});
