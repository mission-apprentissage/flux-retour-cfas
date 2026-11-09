import { ObjectId } from "mongodb";
import type { IEffectif } from "shared/models/data/effectifs.model";
import {
  FRANCE_TRAVAIL_SITUATION_ENUM,
  type IFranceTravailEffectif,
} from "shared/models/data/franceTravailEffectif.model";
import type { IOrganisationCreate } from "shared/models/data/organisations.model";
import { beforeEach, describe, expect, it } from "vitest";

import { franceTravailEffectifsDb, usersMigrationDb } from "@/common/model/collections";
import { createRandomOrganisme, createSampleEffectif } from "@tests/data/randomizedSample";
import { useMongo } from "@tests/jest/setupMongo";
import { initTestApp, RequestAsOrganisationFunc, testDoc } from "@tests/utils/testUtils";

const organisationFranceTravail: IOrganisationCreate = {
  type: "FRANCE_TRAVAIL",
  nom: "France Travail Auvergne-Rhône-Alpes",
  code_region: "84",
};

const body = {
  commentaire: "Contacté par téléphone",
  situation: FRANCE_TRAVAIL_SITUATION_ENUM.ENTREPRISE,
  code_secteur: 1,
};

async function insererDossierFt(code_region: string) {
  const organisme = { _id: new ObjectId(), ...createRandomOrganisme() };
  const effectif = { _id: new ObjectId(), ...(await createSampleEffectif({ organisme })) };
  const dossier = testDoc<IFranceTravailEffectif>({
    created_at: new Date(),
    effectif_id: effectif._id,
    effectif_snapshot: effectif as IEffectif,
    code_region,
    date_inscription: new Date(),
    romes: { code: ["A1101"], secteur_activites: [{ code_secteur: 1, libelle_secteur: "Agriculture" }] },
    current_status: { value: null, date: null },
    ft_data: { 1: null },
  });
  await franceTravailEffectifsDb().insertOne(dossier);
  return dossier;
}

describe("PUT /api/v1/organisation/france-travail/effectif/:id", () => {
  useMongo();

  let requestAsOrganisation: RequestAsOrganisationFunc;

  beforeEach(async () => {
    const app = await initTestApp();
    requestAsOrganisation = app.requestAsOrganisation;
  });

  it("enregistre la situation d'un dossier de la région de l'organisation", async () => {
    const dossier = await insererDossierFt("84");

    const response = await requestAsOrganisation(
      organisationFranceTravail,
      "put",
      `/api/v1/organisation/france-travail/effectif/${dossier.effectif_id.toString()}`,
      body
    );

    expect(response.status).toBe(200);
    const user = await usersMigrationDb().findOne({});
    const enBase = await franceTravailEffectifsDb().findOne({ _id: dossier._id });
    expect(enBase?.ft_data[1]).toEqual({
      situation: FRANCE_TRAVAIL_SITUATION_ENUM.ENTREPRISE,
      commentaire: "Contacté par téléphone",
      created_at: expect.any(Date),
      created_by: user?._id,
    });
  });

  it("refuse un dossier d'une autre région et le laisse inchangé", async () => {
    const dossier = await insererDossierFt("11");

    const response = await requestAsOrganisation(
      organisationFranceTravail,
      "put",
      `/api/v1/organisation/france-travail/effectif/${dossier.effectif_id.toString()}`,
      body
    );

    expect(response.status).toBe(404);
    const enBase = await franceTravailEffectifsDb().findOne({ _id: dossier._id });
    expect(enBase?.ft_data).toEqual({ 1: null });
  });

  it("répond 404 pour un dossier absent", async () => {
    const response = await requestAsOrganisation(
      organisationFranceTravail,
      "put",
      `/api/v1/organisation/france-travail/effectif/${new ObjectId().toString()}`,
      body
    );

    expect(response.status).toBe(404);
  });
});
