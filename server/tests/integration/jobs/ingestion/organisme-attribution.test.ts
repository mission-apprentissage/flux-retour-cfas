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

const CMAR_HDF = { uai: "0593321P", siret: "13002374000439" };
const ROUVIGNIES = { uai: "0597044L", siret: "13002374000272" };
const UAI_TRITH = "0597346P";
const ABBEVILLE = { uai: "0802203K", siret: "13002374000389" };
const ROBERVAL = { uai: "0601787S", siret: "19600005300013" };

const FORINVAL = { uai: "0802084F", siret: "18800864300010" };
const FELIX_FAURE = { uai: "0600001A", siret: "19600001200019" };
const CNAM_HDF = { uai: "0802196C", siret: "34896746400028" };

type Identifiant = { uai: string; siret: string };
type CorrespondanceSiret = { lui_meme: boolean; son_formateur: boolean; son_responsable: boolean };
type Correspondances = {
  uai: { lui_meme: boolean; son_lieu: boolean } | null;
  siret: CorrespondanceSiret | null;
};

const siretSansLien: CorrespondanceSiret = { lui_meme: false, son_formateur: false, son_responsable: false };

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

const reponseParLieu = (resultat: Identifiant, candidat: Identifiant, siretDuResultat = siretSansLien) => ({
  metadata: metadataOk,
  resultat: organismeApi(resultat, { uai: { lui_meme: false, son_lieu: true }, siret: siretDuResultat }),
  candidats: [
    organismeApi(candidat, {
      uai: { lui_meme: false, son_lieu: false },
      siret: { lui_meme: true, son_formateur: false, son_responsable: false },
    }),
  ],
});

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

function organisme(identifiant: Identifiant, extra: Partial<IOrganisme> = {}): IOrganisme {
  return { _id: new ObjectId(), ...createRandomOrganisme({ reseaux: [] }), ...identifiant, ...extra };
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
    lemonnier = organisme(LEMONNIER);
    genech = organisme(GENECH);
    cfppa = organisme(CFPPA_65);
    await organismesDb().insertMany([lemonnier, genech, cfppa]);
    mockApiApprentissageCertificationApi();
  });

  it("retient le transmetteur quand l'API ne rattache que par lieu et que le SIRET envoyé est le sien", async () => {
    mockRecherche({ uai: UAI_LIEU_CHEZ_GENECH, siret: LEMONNIER.siret }, reponseParLieu(GENECH, LEMONNIER));
    mockRecherche(LEMONNIER, reponseExacte(LEMONNIER));
    const { insertedId } = await effectifsQueueDb().insertOne(
      dossier({ uai: UAI_LIEU_CHEZ_GENECH, siret: LEMONNIER.siret }, lemonnier._id.toString())
    );

    await processEffectifsQueue();

    const queue = await effectifsQueueDb().findOne({ _id: insertedId });
    expect(queue).toMatchObject({
      has_error: false,
      organisme_id: lemonnier._id,
      organisme_attribution: {
        formateur: { mode: "transmetteur", uai: LEMONNIER.uai, siret: LEMONNIER.siret },
        responsable: { mode: "exact", uai: LEMONNIER.uai, siret: LEMONNIER.siret },
      },
    });
    const effectif = await effectifsDb().findOne({ _id: queue?.effectif_id ?? undefined });
    expect(effectif?.organisme_id).toEqual(lemonnier._id);
    expect(effectif?.organisme_formateur_id).toEqual(lemonnier._id);
    expect(effectif?.organisme_responsable_id).toEqual(lemonnier._id);
  });

  it("applique le même surclassement au responsable", async () => {
    mockRecherche(LEMONNIER, reponseExacte(LEMONNIER));
    mockRecherche({ uai: UAI_LIEU_CHEZ_GENECH, siret: LEMONNIER.siret }, reponseParLieu(GENECH, LEMONNIER));
    const { insertedId } = await effectifsQueueDb().insertOne(
      dossier(LEMONNIER, lemonnier._id.toString(), { uai: UAI_LIEU_CHEZ_GENECH, siret: LEMONNIER.siret })
    );

    await processEffectifsQueue();

    const queue = await effectifsQueueDb().findOne({ _id: insertedId });
    expect(queue).toMatchObject({
      has_error: false,
      organisme_id: lemonnier._id,
      organisme_attribution: {
        formateur: { mode: "exact", uai: LEMONNIER.uai, siret: LEMONNIER.siret },
        responsable: { mode: "transmetteur", uai: LEMONNIER.uai, siret: LEMONNIER.siret },
      },
    });
    const effectif = await effectifsDb().findOne({ _id: queue?.effectif_id ?? undefined });
    expect(effectif?.organisme_responsable_id).toEqual(lemonnier._id);
  });

  it("retient un formateur déclaré du transmetteur quand l'API rattache à la tête de réseau par lieu", async () => {
    const rouvigniesId = new ObjectId();
    const hdf = organisme(CMAR_HDF, { organismesFormateurs: [{ _id: rouvigniesId, ...ROUVIGNIES }] });
    const rouvignies = { ...organisme(ROUVIGNIES), _id: rouvigniesId };
    await organismesDb().insertMany([hdf, rouvignies]);
    mockRecherche(
      { uai: UAI_TRITH, siret: ROUVIGNIES.siret },
      reponseParLieu(CMAR_HDF, ROUVIGNIES, { lui_meme: false, son_formateur: true, son_responsable: false })
    );
    mockRecherche(CMAR_HDF, reponseExacte(CMAR_HDF));
    const { insertedId } = await effectifsQueueDb().insertOne(
      dossier({ uai: UAI_TRITH, siret: ROUVIGNIES.siret }, hdf._id.toString(), CMAR_HDF)
    );

    await processEffectifsQueue();

    const queue = await effectifsQueueDb().findOne({ _id: insertedId });
    expect(queue).toMatchObject({
      has_error: false,
      organisme_id: rouvignies._id,
      organisme_attribution: {
        formateur: { mode: "famille", uai: ROUVIGNIES.uai, siret: ROUVIGNIES.siret },
        responsable: { mode: "exact", uai: CMAR_HDF.uai, siret: CMAR_HDF.siret },
      },
    });
    const effectif = await effectifsDb().findOne({ _id: queue?.effectif_id ?? undefined });
    expect(effectif?.organisme_id).toEqual(rouvignies._id);
    expect(effectif?.organisme_responsable_id).toEqual(hdf._id);
  });

  it("retient un organisme qui déclare le transmetteur comme responsable quand l'API rattache par lieu", async () => {
    const hdfId = new ObjectId();
    const hdf = { ...organisme(CMAR_HDF), _id: hdfId };
    const rouvignies = organisme(ROUVIGNIES, { organismesResponsables: [{ _id: hdfId, ...CMAR_HDF }] });
    await organismesDb().insertMany([hdf, rouvignies]);
    mockRecherche(
      { uai: UAI_TRITH, siret: ROUVIGNIES.siret },
      reponseParLieu(CMAR_HDF, ROUVIGNIES, { lui_meme: false, son_formateur: true, son_responsable: false })
    );
    mockRecherche(CMAR_HDF, reponseExacte(CMAR_HDF));
    const { insertedId } = await effectifsQueueDb().insertOne(
      dossier({ uai: UAI_TRITH, siret: ROUVIGNIES.siret }, hdf._id.toString(), CMAR_HDF)
    );

    await processEffectifsQueue();

    const queue = await effectifsQueueDb().findOne({ _id: insertedId });
    expect(queue).toMatchObject({
      has_error: false,
      organisme_id: rouvignies._id,
      organisme_attribution: { formateur: { mode: "famille", uai: ROUVIGNIES.uai, siret: ROUVIGNIES.siret } },
    });
  });

  it("retient le formateur de plus petit identifiant quand plusieurs organismes de la famille partagent le SIRET envoyé", async () => {
    const tete = { uai: "0461111H", siret: "33333333300032" };
    const siteA = { uai: "0462222R", siret: "44444444400046" };
    const siteB = { uai: "0463333Y", siret: siteA.siret };
    const idA = new ObjectId();
    const idB = new ObjectId();
    const teteReseau = organisme(tete, {
      organismesFormateurs: [
        { _id: idB, ...siteB },
        { _id: idA, ...siteA },
      ],
    });
    await organismesDb().insertMany([teteReseau, { ...organisme(siteB), _id: idB }, { ...organisme(siteA), _id: idA }]);
    mockRecherche(
      { uai: "0464444F", siret: siteA.siret },
      reponseParLieu(tete, siteA, { lui_meme: false, son_formateur: true, son_responsable: false })
    );
    mockRecherche(tete, reponseExacte(tete));
    const { insertedId } = await effectifsQueueDb().insertOne(
      dossier({ uai: "0464444F", siret: siteA.siret }, teteReseau._id.toString(), tete)
    );

    await processEffectifsQueue();

    const queue = await effectifsQueueDb().findOne({ _id: insertedId });
    expect(queue).toMatchObject({
      has_error: false,
      organisme_id: idA,
      organisme_attribution: { formateur: { mode: "famille", uai: siteA.uai, siret: siteA.siret } },
    });
  });

  it("conserve le formateur rendu par l'API quand le SIRET envoyé est celui de son responsable", async () => {
    const responsable = { uai: "0451111N", siret: "11111111100014" };
    const formateur = { uai: "0452222W", siret: "22222222200028" };
    const responsableId = new ObjectId();
    const formateurId = new ObjectId();
    await organismesDb().insertMany([
      { ...organisme(responsable, { organismesFormateurs: [{ _id: formateurId, ...formateur }] }), _id: responsableId },
      {
        ...organisme(formateur, { organismesResponsables: [{ _id: responsableId, ...responsable }] }),
        _id: formateurId,
      },
    ]);
    mockRecherche(
      { uai: "0453333D", siret: responsable.siret },
      reponseParLieu(formateur, responsable, { lui_meme: false, son_formateur: false, son_responsable: true })
    );
    mockRecherche(responsable, reponseExacte(responsable));
    const { insertedId } = await effectifsQueueDb().insertOne(
      dossier({ uai: "0453333D", siret: responsable.siret }, responsableId.toString(), responsable)
    );

    await processEffectifsQueue();

    const queue = await effectifsQueueDb().findOne({ _id: insertedId });
    expect(queue).toMatchObject({
      has_error: false,
      organisme_id: formateurId,
      organisme_attribution: {
        formateur: { mode: "lieu", uai: formateur.uai, siret: formateur.siret },
        responsable: { mode: "exact" },
      },
    });
  });

  it("conserve le rattachement par lieu quand le SIRET envoyé est fermé au référentiel", async () => {
    const hdf = organisme(CMAR_HDF);
    const abbeville = organisme(ABBEVILLE, { ferme: true, organismesResponsables: [{ _id: hdf._id, ...CMAR_HDF }] });
    await organismesDb().insertMany([hdf, abbeville]);
    mockRecherche(ABBEVILLE, reponseParLieu(CMAR_HDF, ABBEVILLE));
    mockRecherche(CMAR_HDF, reponseExacte(CMAR_HDF));
    const { insertedId } = await effectifsQueueDb().insertOne(dossier(ABBEVILLE, hdf._id.toString(), CMAR_HDF));

    await processEffectifsQueue();

    const queue = await effectifsQueueDb().findOne({ _id: insertedId });
    expect(queue).toMatchObject({
      has_error: false,
      organisme_id: hdf._id,
      organisme_attribution: { formateur: { mode: "lieu", uai: CMAR_HDF.uai, siret: CMAR_HDF.siret } },
    });
  });

  it("mémorise une UAI retenue nulle quand le référentiel ne connaît pas d'UAI pour le SIRET", async () => {
    const roberval = organisme(ROBERVAL, { uai: null });
    await organismesDb().insertOne(roberval);
    mockRecherche(ROBERVAL, {
      metadata: metadataOk,
      resultat: {
        ...organismeApi(ROBERVAL, {
          uai: null,
          siret: { lui_meme: true, son_formateur: false, son_responsable: false },
        }),
        organisme: { identifiant: { uai: null, siret: ROBERVAL.siret } },
      },
      candidats: [],
    });
    mockRecherche(LEMONNIER, reponseExacte(LEMONNIER));
    const { insertedId } = await effectifsQueueDb().insertOne(dossier(ROBERVAL, lemonnier._id.toString()));

    await processEffectifsQueue();

    const queue = await effectifsQueueDb().findOne({ _id: insertedId });
    expect(queue).toMatchObject({
      has_error: false,
      organisme_id: roberval._id,
      organisme_attribution: { formateur: { mode: "siret", uai: null, siret: ROBERVAL.siret } },
    });
  });

  it("conserve le rattachement par lieu quand le SIRET envoyé n'est ni le transmetteur ni sa famille", async () => {
    const forinval = organisme(FORINVAL);
    const felixFaure = organisme(FELIX_FAURE);
    const cnam = organisme(CNAM_HDF);
    await organismesDb().insertMany([forinval, felixFaure, cnam]);
    mockRecherche(FELIX_FAURE, reponseParLieu(FORINVAL, FELIX_FAURE));
    mockRecherche(CNAM_HDF, reponseExacte(CNAM_HDF));
    const { insertedId } = await effectifsQueueDb().insertOne(dossier(FELIX_FAURE, cnam._id.toString(), CNAM_HDF));

    await processEffectifsQueue();

    const queue = await effectifsQueueDb().findOne({ _id: insertedId });
    expect(queue).toMatchObject({
      has_error: false,
      organisme_id: forinval._id,
      organisme_attribution: {
        formateur: { mode: "lieu", uai: FORINVAL.uai, siret: FORINVAL.siret },
        responsable: { mode: "exact" },
      },
    });
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

  it("mémorise l'indisponibilité de l'API quand la recherche d'organisme échoue", async () => {
    nock(API).get("/organisme/v1/recherche").query(true).replyWithError("API indisponible").persist();
    const { insertedId } = await effectifsQueueDb().insertOne(dossier(CFPPA_65, cfppa._id.toString(), CFPPA_65));

    await processEffectifsQueue();

    const queue = await effectifsQueueDb().findOne({ _id: insertedId });
    expect(queue).toMatchObject({
      has_error: false,
      organisme_id: cfppa._id,
      organisme_attribution: {
        formateur: { mode: "indisponible", uai: CFPPA_65.uai, siret: CFPPA_65.siret },
        responsable: { mode: "indisponible", uai: CFPPA_65.uai, siret: CFPPA_65.siret },
      },
    });
  });
});
