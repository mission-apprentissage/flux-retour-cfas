import { ObjectId } from "bson";
import { STATUT_APPRENANT } from "shared";
import type { IMissionLocaleEffectif } from "shared/models";
import { getAnneesScolaireListFromDate } from "shared/utils";
import { describe, expect, it } from "vitest";

import { missionLocaleEffectifsDb } from "@/common/model/collections";
import { up } from "@/db/migrations/20260917160000-backfill-acc-conjoint-at";
import { createRandomOrganisme, createSampleEffectif } from "@tests/data/randomizedSample";
import { useMongo } from "@tests/jest/setupMongo";

useMongo();

const ANNEE_SCOLAIRE = getAnneesScolaireListFromDate(new Date())[0];

type OrganismeData = NonNullable<IMissionLocaleEffectif["organisme_data"]>;

const insertDossier = async (organismeData: Partial<OrganismeData>) => {
  const _id = new ObjectId();
  const effectifId = new ObjectId();
  const organisme = { _id: new ObjectId(), ...createRandomOrganisme({ siret: "19040492100016" }) };
  const now = new Date();
  const snapshot = await createSampleEffectif({
    organisme,
    annee_scolaire: ANNEE_SCOLAIRE,
    apprenant: { date_de_naissance: new Date(now.getFullYear() - 20, 0, 1) },
  });
  await missionLocaleEffectifsDb().insertOne({
    _id,
    mission_locale_id: new ObjectId(),
    effectif_id: effectifId,
    effectif_snapshot: { ...snapshot, _id: effectifId, organisme_id: organisme._id },
    effectif_snapshot_date: now,
    date_rupture: new Date("2026-01-15"),
    current_status: { value: STATUT_APPRENANT.RUPTURANT, date: new Date("2026-01-15") },
    created_at: new Date("2026-02-04"),
    organisme_data: { has_unread_notification: false, ...organismeData },
  } as IMissionLocaleEffectif);
  return _id;
};

describe("migration backfill-acc-conjoint-at", () => {
  it("copie reponse_at dans acc_conjoint_at pour les collaborations existantes", async () => {
    const reponseAt = new Date("2026-02-03T09:15:00.000Z");
    const id = await insertDossier({ acc_conjoint: true, reponse_at: reponseAt });

    await up();

    const dossier = await missionLocaleEffectifsDb().findOne({ _id: id });
    expect(dossier?.organisme_data?.acc_conjoint_at).toEqual(reponseAt);
    expect(dossier?.organisme_data?.reponse_at).toEqual(reponseAt);
  });

  it("se replie sur created_at quand la collaboration n'a pas de reponse_at", async () => {
    const id = await insertDossier({ acc_conjoint: true });

    await up();

    const dossier = await missionLocaleEffectifsDb().findOne({ _id: id });
    expect(dossier?.organisme_data?.acc_conjoint_at).toEqual(new Date("2026-02-04"));
  });

  it("ne touche ni les dossiers sans collaboration ni ceux déjà datés", async () => {
    const dejaDate = new Date("2026-03-01T00:00:00.000Z");
    const sansCollab = await insertDossier({ acc_conjoint: false, reponse_at: new Date("2026-02-01") });
    const dejaPose = await insertDossier({
      acc_conjoint: true,
      reponse_at: new Date("2026-04-01"),
      acc_conjoint_at: dejaDate,
    });

    await up();

    const dossierSansCollab = await missionLocaleEffectifsDb().findOne({ _id: sansCollab });
    expect(dossierSansCollab?.organisme_data).not.toHaveProperty("acc_conjoint_at");
    const dossierDejaPose = await missionLocaleEffectifsDb().findOne({ _id: dejaPose });
    expect(dossierDejaPose?.organisme_data?.acc_conjoint_at).toEqual(dejaDate);
  });
});
