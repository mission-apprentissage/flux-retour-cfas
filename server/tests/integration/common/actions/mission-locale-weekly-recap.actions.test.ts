import { ObjectId } from "mongodb";
import { STATUT_APPRENANT } from "shared/constants";
import type { IMissionLocaleEffectif, IOrganisationMissionLocale } from "shared/models";
import { SITUATION_ENUM } from "shared/models/data/missionLocaleEffectif.model";
import type { IOrganisation } from "shared/models/data/organisations.model";
import { getAnneesScolaireListFromDate } from "shared/utils";
import { beforeEach, describe, expect, it } from "vitest";

import { getMissionLocaleEffectifsStats } from "@/common/actions/mission-locale/mission-locale-weekly-recap.actions";
import { missionLocaleEffectifsDb, organisationsDb, organismesDb } from "@/common/model/collections";
import { createRandomOrganisme, createSampleEffectif } from "@tests/data/randomizedSample";
import { useMongo } from "@tests/jest/setupMongo";
import { id, testDoc } from "@tests/utils/testUtils";

const ANNEE_SCOLAIRE = getAnneesScolaireListFromDate(new Date())[0];
const organismeId = new ObjectId(id(1));
const mlOrganisationId = new ObjectId(id(2));
const ML_ID = 42;

const sampleOrganisme = {
  _id: organismeId,
  ...createRandomOrganisme({ siret: "19040492100016" }),
};

const missionLocale = {
  _id: mlOrganisationId,
  type: "MISSION_LOCALE",
  ml_id: ML_ID,
  nom: "ML Test",
  created_at: new Date(),
} as IOrganisationMissionLocale;

const NOW = Date.now();
const daysAgo = (days: number) => new Date(NOW - days * 24 * 60 * 60 * 1000);
const yearsAgo = (years: number) => {
  const d = new Date(NOW);
  d.setFullYear(d.getFullYear() - years);
  return d;
};

async function insertMlRecord(nom: string, overrides: Record<string, unknown> = {}) {
  const snapshot = await createSampleEffectif({
    organisme: sampleOrganisme,
    annee_scolaire: ANNEE_SCOLAIRE,
    apprenant: { nom, prenom: "Test", date_de_naissance: yearsAgo(20) },
  });

  await missionLocaleEffectifsDb().insertOne(
    testDoc<IMissionLocaleEffectif>({
      _id: new ObjectId(),
      mission_locale_id: mlOrganisationId,
      effectif_id: new ObjectId(),
      effectif_snapshot: {
        ...snapshot,
        _id: new ObjectId(),
        organisme_id: organismeId,
        _computed: {
          ...snapshot._computed,
          statut: { ...snapshot._computed?.statut, en_cours: STATUT_APPRENANT.RUPTURANT },
        },
      },
      effectif_snapshot_date: new Date(NOW),
      date_rupture: daysAgo(30),
      created_at: daysAgo(30),
      current_status: { value: STATUT_APPRENANT.RUPTURANT, date: daysAgo(30) },
      ...overrides,
    })
  );
}

describe("getMissionLocaleEffectifsStats", () => {
  useMongo();

  beforeEach(async () => {
    await missionLocaleEffectifsDb().deleteMany({});
    await organisationsDb().deleteMany({});
    await organismesDb().deleteMany({});
    await organismesDb().insertOne(sampleOrganisme);
    await organisationsDb().insertOne(testDoc<IOrganisation>(missionLocale));
  });

  it("ne compte que les demandes de RDV encore à traiter ou à recontacter", async () => {
    await insertMlRecord("ATRAITER", { souhaite_rdv: true });
    await insertMlRecord("ARECONTACTER", { souhaite_rdv: true, situation: SITUATION_ENUM.CONTACTE_SANS_RETOUR });
    await insertMlRecord("TRAITE", { souhaite_rdv: true, situation: SITUATION_ENUM.INJOIGNABLE_APRES_RELANCES });
    await insertMlRecord("SANSRDV");

    const stats = await getMissionLocaleEffectifsStats(ML_ID);

    expect(stats.effectifs_souhaite_rdv).toBe(2);
  });

  it("ne compte aucune demande de RDV quand tous les jeunes concernés sont traités", async () => {
    await insertMlRecord("TRAITE1", { souhaite_rdv: true, situation: SITUATION_ENUM.INJOIGNABLE_APRES_RELANCES });
    await insertMlRecord("TRAITE2", { souhaite_rdv: true, situation: SITUATION_ENUM.RDV_PRIS });

    const stats = await getMissionLocaleEffectifsStats(ML_ID);

    expect(stats.effectifs_souhaite_rdv).toBe(0);
    expect(stats.total).toBe(0);
  });
});
