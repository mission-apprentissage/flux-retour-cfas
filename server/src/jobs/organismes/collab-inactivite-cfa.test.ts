import { subDays } from "date-fns";
import { ObjectId } from "mongodb";
import { STATUT_APPRENANT } from "shared";
import type { IMissionLocaleEffectif } from "shared/models";
import type { IOrganisation } from "shared/models/data/organisations.model";
import type { IOrganisme } from "shared/models/data/organismes.model";
import type { IUsersMigration } from "shared/models/data/usersMigration.model";
import { generateOrganismeFixture } from "shared/models/fixtures/organisme.fixture";
import { getAnneesScolaireListFromDate } from "shared/utils";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { enqueueBrevoEvent } from "@/common/actions/brevo/events/enqueue-event";
import {
  auditLogsDb,
  brevoSyncSettingsDb,
  missionLocaleEffectifsDb,
  organisationsDb,
  organismesDb,
  usersMigrationDb,
} from "@/common/model/collections";
import { createSampleEffectif } from "@tests/data/randomizedSample";
import { useMongo } from "@tests/jest/setupMongo";
import { testDoc } from "@tests/utils/testUtils";

import { buildOrgaOf, buildUser } from "../../common/actions/brevo/contacts/fixtures";

import { collabInactiviteCfaJob } from "./collab-inactivite-cfa";

vi.mock("@/common/actions/brevo/events/enqueue-event", () => ({
  enqueueBrevoEvent: vi.fn(),
}));

useMongo();

const enqueueMock = vi.mocked(enqueueBrevoEvent);

const daysAgo = (n: number) => subDays(new Date(), n);

let siretCounter = 10000000000000;

const insertCfa = async ({
  mlActivatedAt,
  lastConnections = [],
  organismeOverrides = {},
  usersOverrides = [],
}: {
  mlActivatedAt: Date | null;
  lastConnections?: Array<Date | null>;
  organismeOverrides?: Partial<IOrganisme>;
  usersOverrides?: Array<Partial<IUsersMigration>>;
}) => {
  const organisme = generateOrganismeFixture({
    siret: `${++siretCounter}`,
    uai: "0802004U",
    is_allowed_collab: true,
    ...organismeOverrides,
  });
  await organismesDb().insertOne(organisme, { bypassDocumentValidation: true });
  const orga = buildOrgaOf({
    organisme_id: organisme._id.toString(),
    siret: organisme.siret,
    ...(mlActivatedAt ? { ml_beta_activated_at: mlActivatedAt } : {}),
  });
  await organisationsDb().insertOne(testDoc<IOrganisation>(orga));
  const users = lastConnections.map((lastConnection, i) =>
    buildUser(orga, { ...(lastConnection ? { last_connection: lastConnection } : {}), ...(usersOverrides[i] ?? {}) })
  );
  if (users.length) {
    await usersMigrationDb().insertMany(users.map((u) => testDoc<IUsersMigration>(u)));
  }
  return { organisme, orga, users };
};

const reload = (id: ObjectId) => organismesDb().findOne({ _id: id });

const enableEvents = () =>
  brevoSyncSettingsDb().insertOne(
    testDoc({
      _id: new ObjectId(),
      key: "brevo-contact-sync",
      daily_full_sync_enabled: false,
      instant_sync_enabled: false,
      events_enabled: true,
      updated_at: new Date(),
      updated_by: "test",
    })
  );

describe("collabInactiviteCfaJob", () => {
  beforeEach(() => {
    enqueueMock.mockReset();
  });

  describe("phase A — relance", () => {
    beforeEach(enableEvents);

    it("relance un CFA sans connexion depuis plus de 30 j et pose le verrou", async () => {
      const { organisme, users } = await insertCfa({ mlActivatedAt: daysAgo(120), lastConnections: [daysAgo(40)] });

      const result = await collabInactiviteCfaJob();

      expect(result.relances).toBe(1);
      expect(enqueueMock).toHaveBeenCalledWith("collab-inactivite", { userId: users[0]._id.toString() });
      expect((await reload(organisme._id))?.collab_inactivity_email_sent_at).toBeInstanceOf(Date);
    });

    it("ne relance pas un CFA connecté depuis moins de 30 j", async () => {
      const { organisme } = await insertCfa({ mlActivatedAt: daysAgo(120), lastConnections: [daysAgo(10)] });

      const result = await collabInactiviteCfaJob();

      expect(result.relances).toBe(0);
      expect(enqueueMock).not.toHaveBeenCalled();
      expect((await reload(organisme._id))?.collab_inactivity_email_sent_at).toBeUndefined();
    });

    it("prend l'activation ML comme plancher d'activité", async () => {
      await insertCfa({ mlActivatedAt: daysAgo(10), lastConnections: [daysAgo(200)] });

      const result = await collabInactiviteCfaJob();

      expect(result.relances).toBe(0);
    });

    it("retient la connexion la plus récente parmi les membres confirmés", async () => {
      await insertCfa({
        mlActivatedAt: daysAgo(120),
        lastConnections: [daysAgo(60), daysAgo(3), daysAgo(5)],
        usersOverrides: [{}, { account_status: "PENDING_ADMIN_VALIDATION" }, {}],
      });

      const result = await collabInactiviteCfaJob();

      expect(result.relances).toBe(0);
    });

    it("relance un CFA sans utilisateur confirmé : verrou posé, aucun événement", async () => {
      const { organisme } = await insertCfa({ mlActivatedAt: daysAgo(40) });

      const result = await collabInactiviteCfaJob();

      expect(result.relances).toBe(1);
      expect(result.relancesSansDestinataire).toBe(1);
      expect(enqueueMock).not.toHaveBeenCalled();
      expect((await reload(organisme._id))?.collab_inactivity_email_sent_at).toBeInstanceOf(Date);
    });

    it("n'envoie pas d'événement aux membres désinscrits", async () => {
      const { users } = await insertCfa({
        mlActivatedAt: daysAgo(120),
        lastConnections: [daysAgo(40), daysAgo(50)],
        usersOverrides: [{ unsubscribe: true }, {}],
      });

      await collabInactiviteCfaJob();

      expect(enqueueMock).toHaveBeenCalledTimes(1);
      expect(enqueueMock).toHaveBeenCalledWith("collab-inactivite", { userId: users[1]._id.toString() });
    });

    it("est idempotente : une seule relance par période d'inactivité", async () => {
      const { organisme } = await insertCfa({ mlActivatedAt: daysAgo(120), lastConnections: [daysAgo(40)] });

      await collabInactiviteCfaJob();
      const sentAt = (await reload(organisme._id))?.collab_inactivity_email_sent_at;
      enqueueMock.mockReset();

      const result = await collabInactiviteCfaJob();

      expect(result.relances).toBe(0);
      expect(enqueueMock).not.toHaveBeenCalled();
      expect((await reload(organisme._id))?.collab_inactivity_email_sent_at).toEqual(sentAt);
    });

    it("saute un organisme sans date d'activation ML ni connexion", async () => {
      const { organisme } = await insertCfa({ mlActivatedAt: null });

      const result = await collabInactiviteCfaJob();

      expect(result.skippedNoActivityDate).toBe(1);
      expect((await reload(organisme._id))?.collab_inactivity_email_sent_at).toBeUndefined();
    });

    it("ignore les organismes hors collaboration et ceux déjà suspendus", async () => {
      await insertCfa({ mlActivatedAt: daysAgo(120), organismeOverrides: { is_allowed_collab: false } });
      await insertCfa({ mlActivatedAt: daysAgo(120), organismeOverrides: { collab_suspended_at: daysAgo(2) } });

      const result = await collabInactiviteCfaJob();

      expect(result.examined).toBe(0);
    });

    it("en dryRun, compte sans poser de verrou ni enfiler d'événement", async () => {
      const { organisme } = await insertCfa({ mlActivatedAt: daysAgo(120), lastConnections: [daysAgo(40)] });

      const result = await collabInactiviteCfaJob({ dryRun: true });

      expect(result.relances).toBe(1);
      expect(enqueueMock).not.toHaveBeenCalled();
      expect((await reload(organisme._id))?.collab_inactivity_email_sent_at).toBeUndefined();
    });

    it("respecte limit", async () => {
      await insertCfa({ mlActivatedAt: daysAgo(120), lastConnections: [daysAgo(40)] });
      await insertCfa({ mlActivatedAt: daysAgo(120), lastConnections: [daysAgo(40)] });

      const result = await collabInactiviteCfaJob({ limit: 1 });

      expect(result.examined).toBe(1);
      expect(result.relances).toBe(1);
    });
  });

  it("sans toggle eventsEnabled, la phase A est sautée sans verrou", async () => {
    const { organisme } = await insertCfa({ mlActivatedAt: daysAgo(120), lastConnections: [daysAgo(40)] });

    const result = await collabInactiviteCfaJob();

    expect(result.eventsEnabled).toBe(false);
    expect(result.relances).toBe(0);
    expect(result.relancesSkippedEventsDisabled).toBe(1);
    expect(enqueueMock).not.toHaveBeenCalled();
    expect((await reload(organisme._id))?.collab_inactivity_email_sent_at).toBeUndefined();
  });

  describe("phase B — suspension", () => {
    it("suspend un CFA relancé depuis 5 j sans reconnexion, dénormalise et audite", async () => {
      const emailSentAt = daysAgo(6);
      const { organisme } = await insertCfa({
        mlActivatedAt: daysAgo(120),
        lastConnections: [daysAgo(40)],
        organismeOverrides: { collab_inactivity_email_sent_at: emailSentAt },
      });
      const effectifId = new ObjectId();
      const snapshot = await createSampleEffectif({
        organisme,
        annee_scolaire: getAnneesScolaireListFromDate(new Date())[0],
        apprenant: { date_de_naissance: new Date(new Date().getFullYear() - 20, 0, 1) },
      });
      await missionLocaleEffectifsDb().insertOne({
        _id: new ObjectId(),
        mission_locale_id: new ObjectId(),
        effectif_id: effectifId,
        effectif_snapshot: { ...snapshot, _id: effectifId, organisme_id: organisme._id },
        effectif_snapshot_date: new Date(),
        date_rupture: daysAgo(10),
        current_status: { value: STATUT_APPRENANT.RUPTURANT, date: daysAgo(10) },
        created_at: daysAgo(10),
        computed: { organisme: { ml_beta_activated_at: daysAgo(120), is_allowed_collab: true } },
      } as IMissionLocaleEffectif);

      const result = await collabInactiviteCfaJob();

      expect(result.suspensions).toBe(1);
      const updated = await reload(organisme._id);
      expect(updated?.collab_suspended_at).toBeInstanceOf(Date);
      expect(updated?.collab_inactivity_email_sent_at).toEqual(emailSentAt);

      const dossier = await missionLocaleEffectifsDb().findOne({ effectif_id: effectifId });
      expect(dossier?.computed?.organisme?.collab_suspended_at).toEqual(updated?.collab_suspended_at);

      const audit = await auditLogsDb().findOne({ action: "collab_suspended_inactivity" });
      expect(audit?.data).toMatchObject({ organisme_id: organisme._id, email_sent_at: emailSentAt });
    });

    it("attend 5 j après la relance avant de suspendre", async () => {
      const { organisme } = await insertCfa({
        mlActivatedAt: daysAgo(120),
        lastConnections: [daysAgo(40)],
        organismeOverrides: { collab_inactivity_email_sent_at: daysAgo(3) },
      });

      const result = await collabInactiviteCfaJob();

      expect(result.suspensions).toBe(0);
      expect((await reload(organisme._id))?.collab_suspended_at).toBeUndefined();
    });

    it("ne suspend pas un CFA reconnecté après la relance et le relance à nouveau si besoin", async () => {
      await enableEvents();
      const { organisme } = await insertCfa({
        mlActivatedAt: daysAgo(120),
        lastConnections: [daysAgo(35)],
        organismeOverrides: { collab_inactivity_email_sent_at: daysAgo(70) },
      });

      const result = await collabInactiviteCfaJob();

      expect(result.suspensions).toBe(0);
      expect(result.relances).toBe(1);
      const updated = await reload(organisme._id);
      expect(updated?.collab_suspended_at).toBeUndefined();
      expect(updated?.collab_inactivity_email_sent_at?.getTime()).toBeGreaterThan(daysAgo(1).getTime());
    });

    it("suspend même sans toggle eventsEnabled quand la relance a déjà été posée", async () => {
      const { organisme } = await insertCfa({
        mlActivatedAt: daysAgo(120),
        lastConnections: [daysAgo(40)],
        organismeOverrides: { collab_inactivity_email_sent_at: daysAgo(6) },
      });

      const result = await collabInactiviteCfaJob();

      expect(result.suspensions).toBe(1);
      expect((await reload(organisme._id))?.collab_suspended_at).toBeInstanceOf(Date);
    });

    it("en dryRun, compte la suspension sans l'appliquer", async () => {
      const { organisme } = await insertCfa({
        mlActivatedAt: daysAgo(120),
        lastConnections: [daysAgo(40)],
        organismeOverrides: { collab_inactivity_email_sent_at: daysAgo(6) },
      });

      const result = await collabInactiviteCfaJob({ dryRun: true });

      expect(result.suspensions).toBe(1);
      expect((await reload(organisme._id))?.collab_suspended_at).toBeUndefined();
    });
  });
});
