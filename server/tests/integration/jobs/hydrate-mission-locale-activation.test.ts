import { ObjectId } from "mongodb";
import { STATUT_APPRENANT } from "shared/constants";
import { getAnneesScolaireListFromDate } from "shared/utils";
import { beforeEach, describe, expect, it } from "vitest";

import { effectifsDb, missionLocaleEffectifsDb, organismesDb } from "@/common/model/collections";
import {
  updateEffectifMissionLocaleSnapshotAtMLActivation,
  updateEffectifMissionLocaleSnapshotAtOrganismeActivation,
} from "@/jobs/hydrate/mission-locale/hydrate-mission-locale";
import { createRandomOrganisme, createSampleEffectif } from "@tests/data/randomizedSample";
import { useMongo } from "@tests/jest/setupMongo";
import { id } from "@tests/utils/testUtils";

const ANNEE_SCOLAIRE = getAnneesScolaireListFromDate(new Date())[0];
const organismeId = new ObjectId(id(1));
const mlOrganisationId = new ObjectId(id(2));

const sampleOrganisme = { _id: organismeId, ...createRandomOrganisme({ siret: "19040492100016" }) };

/**
 * Crée un effectif INSCRIT (donc ni rupturant ni en abandon) et son dossier ML : sans les gardes
 * du lot B2b, `updateOrDeleteMissionLocaleSnapshot` soft-delete ce dossier au passage du job.
 */
async function creerDossier(organismeData: Record<string, any> | null, extra: Record<string, any> = {}) {
  const effectifId = new ObjectId();
  const snapshot = await createSampleEffectif({
    organisme: sampleOrganisme,
    annee_scolaire: ANNEE_SCOLAIRE,
    apprenant: { date_de_naissance: new Date(new Date().getFullYear() - 20, 0, 1) },
  });
  const effectif = {
    ...snapshot,
    _id: effectifId,
    organisme_id: organismeId,
    _computed: {
      ...snapshot._computed,
      statut: {
        en_cours: STATUT_APPRENANT.INSCRIT,
        parcours: [{ valeur: STATUT_APPRENANT.INSCRIT, date: new Date("2026-01-01") }],
      },
    },
  };
  await effectifsDb().insertOne(effectif as any);

  const dossierId = new ObjectId();
  await missionLocaleEffectifsDb().insertOne({
    _id: dossierId,
    mission_locale_id: mlOrganisationId,
    effectif_id: effectifId,
    effectif_snapshot: effectif,
    effectif_snapshot_date: new Date(),
    date_rupture: null,
    created_at: new Date(),
    current_status: { value: STATUT_APPRENANT.INSCRIT, date: new Date("2026-01-01") },
    ...(organismeData ? { organisme_data: organismeData } : {}),
    ...extra,
  } as any);

  return dossierId;
}

const estSoftDeleted = async (dossierId: ObjectId) =>
  (await missionLocaleEffectifsDb().findOne({ _id: dossierId }))?.soft_deleted === true;

describe("Refresh de snapshot déclenché par une activation", () => {
  useMongo();

  beforeEach(async () => {
    await effectifsDb().deleteMany({});
    await missionLocaleEffectifsDb().deleteMany({});
    await organismesDb().deleteMany({});
    await organismesDb().insertOne(sampleOrganisme);
  });

  describe("activation d'une Mission Locale", () => {
    it("conserve les dossiers de collaboration et de demande de RDV, soft-delete les autres", async () => {
      const collaboration = await creerDossier({ acc_conjoint: true, reponse_at: new Date() });
      const demandeRdv = await creerDossier(null, { souhaite_rdv: true });
      const sansSignal = await creerDossier({ acc_conjoint: false });

      await updateEffectifMissionLocaleSnapshotAtMLActivation(mlOrganisationId);

      expect(await estSoftDeleted(collaboration)).toBe(false);
      expect(await estSoftDeleted(demandeRdv)).toBe(false);
      expect(await estSoftDeleted(sansSignal)).toBe(true);
    });

    it("laisse la date de rupture nulle sur un dossier de prévention", async () => {
      const collaboration = await creerDossier({ acc_conjoint: true, reponse_at: new Date() });

      await updateEffectifMissionLocaleSnapshotAtMLActivation(mlOrganisationId);

      const dossier = await missionLocaleEffectifsDb().findOne({ _id: collaboration });
      expect(dossier?.date_rupture).toBeNull();
    });
  });

  describe("activation d'un organisme", () => {
    it("conserve les dossiers de collaboration et de demande de RDV, soft-delete les autres", async () => {
      const collaboration = await creerDossier({ acc_conjoint: true, reponse_at: new Date() });
      const demandeRdv = await creerDossier(null, { souhaite_rdv: true });
      const sansSignal = await creerDossier({ acc_conjoint: false });

      await updateEffectifMissionLocaleSnapshotAtOrganismeActivation(organismeId);

      expect(await estSoftDeleted(collaboration)).toBe(false);
      expect(await estSoftDeleted(demandeRdv)).toBe(false);
      expect(await estSoftDeleted(sansSignal)).toBe(true);
    });
  });
});
