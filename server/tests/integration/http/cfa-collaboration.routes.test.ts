import { ObjectId } from "mongodb";
import { ACC_CONJOINT_MOTIF_ENUM } from "shared";
import { CFA_RISQUE_RUPTURE_ENUM, CFA_SITUATION_TYPE_ENUM } from "shared/models/data/missionLocaleEffectif.model";
import { generateOrganismeFixture } from "shared/models/fixtures/organisme.fixture";
import { getAnneesScolaireListFromDate } from "shared/utils";
import { beforeEach, describe, expect, it } from "vitest";

import { effectifsDb, missionLocaleEffectifsDb, organisationsDb, organismesDb } from "@/common/model/collections";
import { createSampleEffectif } from "@tests/data/randomizedSample";
import { useMongo } from "@tests/jest/setupMongo";
import { initTestApp, RequestAsOrganisationFunc } from "@tests/utils/testUtils";

const ANNEE_SCOLAIRE = getAnneesScolaireListFromDate(new Date())[0];
const SIRET = "19040492100016";
const UAI = "0802004U";
const organismeId = new ObjectId();
const mlOrganisationId = new ObjectId();
const ML_NUMERIC_ID = 42;

const ORGANISATION_CFA = { type: "ORGANISME_FORMATION" as const, siret: SIRET, uai: UAI };

let requestAsOrganisation: RequestAsOrganisationFunc;

const verifiedInfo = {
  telephone: "0612345678",
  adresse_code_postal: "75001",
  adresse_commune: "Paris",
};

const brancheA = {
  rupture: false,
  acc_conjoint: true,
  situation_type: CFA_SITUATION_TYPE_ENUM.EN_CONTRAT,
  risque_rupture: CFA_RISQUE_RUPTURE_ENUM.MODERE,
  motif: [ACC_CONJOINT_MOTIF_ENUM.RECHERCHE_EMPLOI],
  commentaires_par_motif: { [ACC_CONJOINT_MOTIF_ENUM.RECHERCHE_EMPLOI]: "CV à retravailler" },
  referent_type: "me",
  verified_info: verifiedInfo,
};

const brancheB = {
  rupture: true,
  acc_conjoint: true,
  situation_type: CFA_SITUATION_TYPE_ENUM.RUPTURE_OU_SORTIE,
  still_at_cfa: true,
  date_rupture: "2026-05-04T00:00:00.000Z",
  cause_rupture: "Désaccord avec l'employeur",
  motif: [ACC_CONJOINT_MOTIF_ENUM.RECHERCHE_EMPLOI],
  commentaires_par_motif: { [ACC_CONJOINT_MOTIF_ENUM.RECHERCHE_EMPLOI]: "CV à retravailler" },
  referent_type: "me",
  verified_info: verifiedInfo,
};

async function insertEffectif(id: ObjectId, organisme = organismeId) {
  const effectif = await createSampleEffectif({
    organisme: generateOrganismeFixture({ _id: organisme, siret: SIRET, uai: UAI }),
    annee_scolaire: ANNEE_SCOLAIRE,
    apprenant: {
      nom: "ROUTE",
      prenom: "Test",
      date_de_naissance: new Date(new Date().getFullYear() - 20, 0, 1),
      adresse: { mission_locale_id: ML_NUMERIC_ID },
    },
  });
  await effectifsDb().insertOne({ ...effectif, _id: id, organisme_id: organisme } as any);
}

const url = (effectifId: ObjectId) => `/api/v1/organismes/${organismeId}/mission-locale/effectif/${effectifId}`;

describe("PUT /organismes/:id/mission-locale/effectif/:id", () => {
  useMongo();

  beforeEach(async () => {
    const app = await initTestApp();
    requestAsOrganisation = app.requestAsOrganisation;

    await organismesDb().insertOne(generateOrganismeFixture({ _id: organismeId, siret: SIRET, uai: UAI }) as any);
    await organisationsDb().insertOne({
      _id: mlOrganisationId,
      type: "MISSION_LOCALE",
      ml_id: ML_NUMERIC_ID,
      nom: "ML Test",
      created_at: new Date(),
    } as any);
  });

  it("crée le dossier et renvoie 200 pour un jeune en contrat (branche A)", async () => {
    const effectifId = new ObjectId();
    await insertEffectif(effectifId);

    const res = await requestAsOrganisation(ORGANISATION_CFA, "put", url(effectifId), brancheA);

    expect(res.status).toBe(200);

    const dossier = await missionLocaleEffectifsDb().findOne({ effectif_id: effectifId });
    expect(dossier?.organisme_data?.acc_conjoint).toBe(true);
    expect(dossier?.organisme_data?.situation_type).toBe(CFA_SITUATION_TYPE_ENUM.EN_CONTRAT);
    expect(dossier?.date_rupture).toBeNull();
    expect(dossier?.cfa_rupture_declaration).toBeUndefined();
  });

  it("enregistre la déclaration de rupture pour la branche B", async () => {
    const effectifId = new ObjectId();
    await insertEffectif(effectifId);

    const res = await requestAsOrganisation(ORGANISATION_CFA, "put", url(effectifId), brancheB);

    expect(res.status).toBe(200);

    const dossier = await missionLocaleEffectifsDb().findOne({ effectif_id: effectifId });
    expect(dossier?.date_rupture).toEqual(new Date("2026-05-04T00:00:00.000Z"));
    expect(dossier?.cfa_rupture_declaration?.date_rupture).toEqual(new Date("2026-05-04T00:00:00.000Z"));
  });

  it("renvoie 400 et le chemin du champ fautif quand une règle de branche est violée", async () => {
    const effectifId = new ObjectId();
    await insertEffectif(effectifId);

    const res = await requestAsOrganisation(ORGANISATION_CFA, "put", url(effectifId), {
      ...brancheA,
      date_rupture: "2026-05-04T00:00:00.000Z",
    });

    expect(res.status).toBe(400);
    expect(res.data.message).toBe("Erreur de validation");
    // Le front s'appuie sur ce chemin pour afficher l'erreur sous le bon champ.
    expect(res.data.issues.map((i) => i.path.join("."))).toContain("date_rupture");
  });

  it("renvoie 400 quand l'adresse du jeune est incomplète", async () => {
    const effectifId = new ObjectId();
    await insertEffectif(effectifId);

    const res = await requestAsOrganisation(ORGANISATION_CFA, "put", url(effectifId), {
      ...brancheA,
      verified_info: { ...verifiedInfo, adresse_commune: "" },
    });

    expect(res.status).toBe(400);
    expect(res.data.issues.map((i) => i.path.join("."))).toContain("verified_info.adresse_commune");
  });

  it("renvoie 409 sur un second envoi (RG2)", async () => {
    const effectifId = new ObjectId();
    await insertEffectif(effectifId);

    await requestAsOrganisation(ORGANISATION_CFA, "put", url(effectifId), brancheA);
    const res = await requestAsOrganisation(ORGANISATION_CFA, "put", url(effectifId), brancheA);

    expect(res.status).toBe(409);
    expect(res.data.message).toContain("déjà été envoyé");
  });

  it("renvoie 404 pour un effectif d'un autre organisme", async () => {
    const effectifId = new ObjectId();
    await insertEffectif(effectifId, new ObjectId());

    const res = await requestAsOrganisation(ORGANISATION_CFA, "put", url(effectifId), brancheA);

    expect(res.status).toBe(404);
  });

  it("refuse un payload accepté par l'ancien formulaire mais sans champ obligatoire", async () => {
    const effectifId = new ObjectId();
    await insertEffectif(effectifId);

    const res = await requestAsOrganisation(ORGANISATION_CFA, "put", url(effectifId), {
      ...brancheA,
      motif: [],
    });

    expect(res.status).toBe(400);
    expect(res.data.issues.map((i) => i.path.join("."))).toContain("motif");
  });
});
