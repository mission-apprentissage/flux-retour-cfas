import { ObjectId } from "mongodb";
import nock from "nock";
import { CODES_STATUT_APPRENANT, SOURCE_APPRENANT } from "shared";
import type { IEffectifQueue } from "shared/models/data/effectifsQueue.model";
import type { IOrganisme } from "shared/models/data/organismes.model";
import { beforeEach, describe, expect, it } from "vitest";

import { effectifsDb, effectifsQueueDb, organismesDb } from "@/common/model/collections";
import { processEffectifsQueue } from "@/jobs/ingestion/process-ingestion";
import { mockApiApprentissageCertificationApi } from "@tests/data/api.apprentissage.beta.gouv.fr/certification/apiApprentissage.certification.mock";
import { createRandomOrganisme } from "@tests/data/randomizedSample";
import { useMongo } from "@tests/jest/setupMongo";
import { useNock } from "@tests/jest/setupNock";

const API = "https://api.apprentissage.beta.gouv.fr/api";

const LEMONNIER = { uai: "0141866C", siret: "78071394700015" };
const GENECH = { uai: "0595689N", siret: "78362626000013" };
const CFPPA_65 = { uai: "0650950E", siret: "19650139900030" };
const UAI_LIEU_CHEZ_GENECH = "0141991N";

type Identifiant = { uai: string; siret: string };
type Correspondances = {
  uai: { lui_meme: boolean; son_lieu: boolean } | null;
  siret: { lui_meme: boolean; son_formateur: boolean; son_responsable: boolean } | null;
};

function organismeApi(identifiant: Identifiant, correspondances: Correspondances) {
  return {
    status: { ouvert: true, declaration_catalogue: true, validation_uai: true },
    correspondances,
    organisme: { identifiant },
  };
}

const metadataOk = { uai: { status: "ok" }, siret: { status: "ok" } };

const reponseExacte = (identifiant: Identifiant) => ({
  metadata: metadataOk,
  resultat: organismeApi(identifiant, {
    uai: { lui_meme: true, son_lieu: false },
    siret: { lui_meme: true, son_formateur: false, son_responsable: false },
  }),
  candidats: [],
});

const reponseParLieu = {
  metadata: metadataOk,
  resultat: organismeApi(GENECH, {
    uai: { lui_meme: false, son_lieu: true },
    siret: { lui_meme: false, son_formateur: false, son_responsable: false },
  }),
  candidats: [
    organismeApi(LEMONNIER, {
      uai: { lui_meme: false, son_lieu: false },
      siret: { lui_meme: true, son_formateur: false, son_responsable: false },
    }),
  ],
};

const reponseUaiCorrigee = {
  metadata: metadataOk,
  resultat: organismeApi(LEMONNIER, {
    uai: { lui_meme: false, son_lieu: true },
    siret: { lui_meme: true, son_formateur: false, son_responsable: false },
  }),
  candidats: [],
};

function mockRecherche(couple: Identifiant, body: object) {
  nock(API).get("/organisme/v1/recherche").query(couple).reply(200, body).persist();
}

function dossier(
  formateur: Identifiant,
  sourceOrganismeId: string,
  responsable: Identifiant = LEMONNIER
): IEffectifQueue {
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
    etablissement_responsable_uai: responsable.uai,
    etablissement_responsable_siret: responsable.siret,
    etablissement_formateur_uai: formateur.uai,
    etablissement_formateur_siret: formateur.siret,
    etablissement_lieu_de_formation_uai: formateur.uai,
    etablissement_lieu_de_formation_siret: formateur.siret,
    etablissement_lieu_de_formation_adresse: "1 rue de la paix",
    etablissement_lieu_de_formation_code_postal: "75000",
    created_at: new Date(),
    source: SOURCE_APPRENANT.FICHIER,
    source_organisme_id: sourceOrganismeId,
  };
}

describe("Attribution de l'organisme à l'ingestion", () => {
  useNock();
  useMongo();

  let lemonnier: IOrganisme;
  let genech: IOrganisme;
  let cfppa: IOrganisme;

  beforeEach(async () => {
    lemonnier = { _id: new ObjectId(), ...createRandomOrganisme({ reseaux: [] }), ...LEMONNIER };
    genech = { _id: new ObjectId(), ...createRandomOrganisme({ reseaux: [] }), ...GENECH };
    cfppa = { _id: new ObjectId(), ...createRandomOrganisme({ reseaux: [] }), ...CFPPA_65 };
    await organismesDb().insertMany([lemonnier, genech, cfppa]);
    mockApiApprentissageCertificationApi();
  });

  it("mémorise une attribution par lieu pour le formateur et exacte pour le responsable", async () => {
    mockRecherche({ uai: UAI_LIEU_CHEZ_GENECH, siret: LEMONNIER.siret }, reponseParLieu);
    mockRecherche(LEMONNIER, reponseExacte(LEMONNIER));
    const { insertedId } = await effectifsQueueDb().insertOne(
      dossier({ uai: UAI_LIEU_CHEZ_GENECH, siret: LEMONNIER.siret }, lemonnier._id.toString())
    );

    await processEffectifsQueue();

    const queue = await effectifsQueueDb().findOne({ _id: insertedId });
    expect(queue).toMatchObject({
      has_error: false,
      organisme_id: genech._id,
      organisme_attribution: {
        formateur: { mode: "lieu", uai: GENECH.uai, siret: GENECH.siret },
        responsable: { mode: "exact", uai: LEMONNIER.uai, siret: LEMONNIER.siret },
      },
    });
    const effectif = await effectifsDb().findOne({ _id: queue?.effectif_id ?? undefined });
    expect(effectif?.organisme_id).toEqual(genech._id);
    expect(effectif?.organisme_responsable_id).toEqual(lemonnier._id);
  });

  it("mémorise une attribution par SIRET quand seule l'UAI est corrigée", async () => {
    mockRecherche({ uai: "0141999Z", siret: LEMONNIER.siret }, reponseUaiCorrigee);
    mockRecherche(LEMONNIER, reponseExacte(LEMONNIER));
    const { insertedId } = await effectifsQueueDb().insertOne(
      dossier({ uai: "0141999Z", siret: LEMONNIER.siret }, lemonnier._id.toString())
    );

    await processEffectifsQueue();

    const queue = await effectifsQueueDb().findOne({ _id: insertedId });
    expect(queue).toMatchObject({
      has_error: false,
      organisme_id: lemonnier._id,
      organisme_attribution: {
        formateur: { mode: "siret", uai: LEMONNIER.uai, siret: LEMONNIER.siret },
        responsable: { mode: "exact" },
      },
    });
  });

  it("mémorise l'absence d'attribution quand l'API est injoignable", async () => {
    nock(API).get("/organisme/v1/recherche").query(true).replyWithError("API indisponible").persist();
    const { insertedId } = await effectifsQueueDb().insertOne(dossier(CFPPA_65, cfppa._id.toString(), CFPPA_65));

    await processEffectifsQueue();

    const queue = await effectifsQueueDb().findOne({ _id: insertedId });
    expect(queue).toMatchObject({
      has_error: false,
      organisme_id: cfppa._id,
      organisme_attribution: {
        formateur: { mode: "aucun", uai: CFPPA_65.uai, siret: CFPPA_65.siret },
        responsable: { mode: "aucun", uai: CFPPA_65.uai, siret: CFPPA_65.siret },
      },
    });
  });
});
