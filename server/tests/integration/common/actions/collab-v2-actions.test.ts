import { ObjectId } from "mongodb";
import { STATUT_APPRENANT } from "shared";
import type { IMissionLocaleEffectif } from "shared/models";
import type { IOrganisation } from "shared/models/data/organisations.model";
import { getAnneesScolaireListFromDate } from "shared/utils";
import { beforeEach, describe, expect, it } from "vitest";

import {
  activateCollabV2,
  deactivateCollabV2,
  ensureCollabOnAfterCollaboration,
  resumeCollab,
} from "@/common/actions/organismes/organismes.admin.actions";
import { auditLogsDb, missionLocaleEffectifsDb, organisationsDb, organismesDb } from "@/common/model/collections";
import { createRandomOrganisme, createSampleEffectif } from "@tests/data/randomizedSample";
import { useMongo } from "@tests/jest/setupMongo";
import { testDoc } from "@tests/utils/testUtils";

useMongo();

const ANNEE_SCOLAIRE = getAnneesScolaireListFromDate(new Date())[0];
const organismeId = new ObjectId();
const activatedAt = new Date("2026-01-10T00:00:00.000Z");
const suspendedAt = new Date("2026-09-01T07:00:00.000Z");
const emailSentAt = new Date("2026-08-27T07:00:00.000Z");
const adminUserId = new ObjectId().toString();

const organisme = { _id: organismeId, ...createRandomOrganisme({ siret: "19040492100016", uai: "0802004U" }) };

const insertDossier = async () => {
  const effectifId = new ObjectId();
  const snapshot = await createSampleEffectif({
    organisme,
    annee_scolaire: ANNEE_SCOLAIRE,
    apprenant: { date_de_naissance: new Date(new Date().getFullYear() - 20, 0, 1) },
  });
  await missionLocaleEffectifsDb().insertOne({
    _id: new ObjectId(),
    mission_locale_id: new ObjectId(),
    effectif_id: effectifId,
    effectif_snapshot: { ...snapshot, _id: effectifId, organisme_id: organismeId },
    effectif_snapshot_date: new Date(),
    date_rupture: new Date("2026-08-20"),
    current_status: { value: STATUT_APPRENANT.RUPTURANT, date: new Date("2026-08-20") },
    created_at: new Date("2026-08-21"),
    computed: {
      organisme: { ml_beta_activated_at: activatedAt, is_allowed_collab: true, collab_suspended_at: suspendedAt },
    },
  } as IMissionLocaleEffectif);
  return effectifId;
};

const reloadOrganisme = () => organismesDb().findOne({ _id: organismeId });

describe("suspension et reprise de collaboration", () => {
  beforeEach(async () => {
    await organismesDb().insertOne({
      ...organisme,
      is_allowed_collab: true,
      collab_suspended_at: suspendedAt,
      collab_inactivity_email_sent_at: emailSentAt,
    });
    await organisationsDb().insertOne(
      testDoc<IOrganisation>({
        type: "ORGANISME_FORMATION",
        siret: organisme.siret,
        uai: organisme.uai,
        organisme_id: organismeId.toString(),
        ml_beta_activated_at: activatedAt,
        created_at: new Date(),
      })
    );
  });

  describe("resumeCollab", () => {
    it("lève la suspension, pose collab_resumed_at, dénormalise et audite", async () => {
      const effectifId = await insertDossier();

      const status = await resumeCollab(organismeId, { reason: "reconnexion", userId: new ObjectId() });

      expect(status).toBe("resumed");
      const updated = await reloadOrganisme();
      expect(updated?.collab_suspended_at).toBeUndefined();
      expect(updated?.collab_inactivity_email_sent_at).toBeUndefined();
      expect(updated?.collab_resumed_at).toBeInstanceOf(Date);
      expect(updated?.is_allowed_collab).toBe(true);

      const dossier = await missionLocaleEffectifsDb().findOne({ effectif_id: effectifId });
      expect(dossier?.computed?.organisme).toEqual({
        ml_beta_activated_at: activatedAt,
        is_allowed_collab: true,
        collab_resumed_at: updated?.collab_resumed_at,
      });

      const audit = await auditLogsDb().findOne({ action: "collab_resumed" });
      expect(audit?.data).toMatchObject({ organisme_id: organismeId, reason: "reconnexion" });
    });

    it("ne pose pas de reprise quand seul le verrou de relance est présent", async () => {
      await organismesDb().updateOne({ _id: organismeId }, { $unset: { collab_suspended_at: "" } });

      const status = await resumeCollab(organismeId, { reason: "reconnexion" });

      expect(status).toBe("email_lock_cleared");
      const updated = await reloadOrganisme();
      expect(updated?.collab_inactivity_email_sent_at).toBeUndefined();
      expect(updated?.collab_resumed_at).toBeUndefined();
      expect(await auditLogsDb().countDocuments({ action: "collab_resumed" })).toBe(0);
    });

    it("ne fait rien sur un organisme ni suspendu ni relancé", async () => {
      await organismesDb().updateOne(
        { _id: organismeId },
        { $unset: { collab_suspended_at: "", collab_inactivity_email_sent_at: "" } }
      );

      expect(await resumeCollab(organismeId, { reason: "reconnexion" })).toBe("nothing_to_resume");
    });
  });

  describe("activateCollabV2 sur un organisme suspendu", () => {
    it("répond already_active et lève la suspension", async () => {
      const effectifId = await insertDossier();

      const result = await activateCollabV2(organismeId.toString(), adminUserId);

      expect(result.status).toBe("already_active");
      const updated = await reloadOrganisme();
      expect(updated?.collab_suspended_at).toBeUndefined();
      expect(updated?.collab_resumed_at).toBeInstanceOf(Date);
      const dossier = await missionLocaleEffectifsDb().findOne({ effectif_id: effectifId });
      expect(dossier?.computed?.organisme?.collab_suspended_at).toBeUndefined();
      const audit = await auditLogsDb().findOne({ action: "collab_resumed" });
      expect(audit?.data).toMatchObject({ reason: "activation_admin", user_id: adminUserId });
    });
  });

  describe("deactivateCollabV2", () => {
    it("retire le flag et les trois champs d'inactivité, sur l'organisme et les dossiers", async () => {
      await organismesDb().updateOne({ _id: organismeId }, { $set: { collab_resumed_at: new Date("2026-07-01") } });
      const effectifId = await insertDossier();

      const result = await deactivateCollabV2(organismeId.toString(), adminUserId);

      expect(result.status).toBe("deactivated");
      const updated = await reloadOrganisme();
      expect(updated?.is_allowed_collab).toBeUndefined();
      expect(updated?.collab_suspended_at).toBeUndefined();
      expect(updated?.collab_inactivity_email_sent_at).toBeUndefined();
      expect(updated?.collab_resumed_at).toBeUndefined();
      const dossier = await missionLocaleEffectifsDb().findOne({ effectif_id: effectifId });
      expect(dossier?.computed?.organisme).toEqual({ is_allowed_collab: false });
    });
  });

  describe("ensureCollabOnAfterCollaboration sur un organisme suspendu", () => {
    it("lève la suspension et répond already_on", async () => {
      const status = await ensureCollabOnAfterCollaboration(organismeId, { effectifId: new ObjectId() });

      expect(status).toBe("already_on");
      const updated = await reloadOrganisme();
      expect(updated?.collab_suspended_at).toBeUndefined();
      expect(updated?.collab_resumed_at).toBeInstanceOf(Date);
      const audit = await auditLogsDb().findOne({ action: "collab_resumed" });
      expect(audit?.data).toMatchObject({ reason: "collaboration_envoyee" });
    });
  });
});
