import { ObjectId } from "mongodb";
import { vi, it, expect, describe, beforeEach } from "vitest";

import { organisationsDb, organismesDb, usersMigrationDb } from "@/common/model/collections";
import { sendEmail } from "@/common/services/mailer/mailer";
import { sendReminderEmails } from "@/jobs/emails/reminder";
import { useMongo } from "@tests/jest/setupMongo";
import { userOrganisme } from "@tests/utils/permissions";
import { initTestApp, testPasswordHash } from "@tests/utils/testUtils";

vi.mock("@/common/services/mailer/mailer");

let app: Awaited<ReturnType<typeof initTestApp>>;

describe("Job send-reminder-emails", () => {
  useMongo();

  beforeEach(async () => {
    app = await initTestApp();
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("relance après 7 jours si pas de configuration ni de données", async () => {
    const { last_transmission_date, ...organisme } = userOrganisme;
    await Promise.all([
      organismesDb().insertOne({
        ...organisme,
      }),
      organisationsDb().insertOne({
        _id: userOrganisme._id,
        type: "ORGANISME_FORMATION",
        siret: userOrganisme.siret,
        uai: userOrganisme.uai ?? null,
        created_at: new Date(),
      }),
      createUser({
        email: "user1@tdb.local",
        createdAt: "2023-10-01T05:00z",
      }),
    ]);

    vi.setSystemTime(new Date("2023-10-08T04:00z"));
    await sendReminderEmails();
    // 0 nouveau mail envoyé car < 7j
    expect(sendEmail).toHaveBeenCalledTimes(0);

    vi.setSystemTime(new Date("2023-10-08T05:00z"));
    await sendReminderEmails();
    // 1 nouveau mail envoyé car >= 7j et 1ère relance
    expect(sendEmail).toHaveBeenCalledTimes(1);

    vi.setSystemTime(new Date("2023-10-08T06:00z"));
    await sendReminderEmails();
    // 0 nouveau mail envoyé car relance déjà envoyée
    expect(sendEmail).toHaveBeenCalledTimes(1);
  });

  it("relance après 7 jours si organisme configuré mais pas de données", async () => {
    const { last_transmission_date, ...organisme } = userOrganisme;
    await Promise.all([
      organismesDb().insertOne({
        ...organisme,
        erps: ["ymag"],
        mode_de_transmission: "API",
        mode_de_transmission_configuration_date: new Date("2023-10-10T10:00z"),
        mode_de_transmission_configuration_author_fullname: "Jean Dupont",
      }),
      organisationsDb().insertOne({
        _id: userOrganisme._id,
        type: "ORGANISME_FORMATION",
        siret: userOrganisme.siret,
        uai: userOrganisme.uai ?? null,
        created_at: new Date(),
      }),
      createUser({
        email: "user1@tdb.local",
        createdAt: "2023-10-01T05:00z",
      }),
    ]);

    vi.setSystemTime(new Date("2023-10-17T08:00z"));
    await sendReminderEmails();
    // 0 nouveau mail envoyé car < 7j
    expect(sendEmail).toHaveBeenCalledTimes(0);

    // TODO: à remettre en place lors de la rèactivation de l'e-mail de relance après 7 jours si organisme configuré mais pas de données

    // advanceTo("2023-10-17T12:00z");
    // await sendReminderEmails();
    // 1 nouveau mail envoyé car >= 7j et 1ère relance
    // expect(sendEmail).toHaveBeenCalledTimes(1);

    // advanceTo("2023-10-17T12:00z");
    // await sendReminderEmails();
    // 0 nouveau mail envoyé car relance déjà envoyée
    // expect(sendEmail).toHaveBeenCalledTimes(1);
  });

  /**
   * Séquencement du test
   * J1 - user 1 s'inscrit
   * J2
   * J3
   * J4 - user 2 s'inscrit
   * J5
   * J6
   * J7
   * J8 - relance user 1 missing_configuration_and_data
   * J9 - configuration par user 2 puis réinitialisation par user 2, doit réinitialiser l'état de relance du user 1, et ne pas toucher à celle du user 2
   * J10 - relance user 1 missing_configuration_and_data
   * J11 - relance user 2 missing_configuration_and_data
   * J12
   */
  it("réinitialisation état des relances avec réinitialisation configuration", async () => {
    const { last_transmission_date, ...organisme } = userOrganisme;
    await Promise.all([
      organismesDb().insertOne({
        ...organisme,
      }),
      organisationsDb().insertOne({
        _id: userOrganisme._id,
        type: "ORGANISME_FORMATION",
        siret: userOrganisme.siret,
        uai: userOrganisme.uai ?? null,
        created_at: new Date(),
      }),
      createUser({
        email: "user1@tdb.local",
        createdAt: "2023-10-01T05:00z",
      }),
      createUser({
        email: "user2@tdb.local",
        createdAt: "2023-10-04T05:00z",
      }),
    ]);

    vi.setSystemTime(new Date("2023-10-07T10:00z"));
    await sendReminderEmails();
    // 0 nouveau mail envoyé car < 7j
    expect(sendEmail).toHaveBeenCalledTimes(0);

    vi.setSystemTime(new Date("2023-10-08T10:00z"));
    await sendReminderEmails();
    // 1 nouveau mail envoyé car >= 7j et 1ère relance pour user 1
    expect(sendEmail).toHaveBeenCalledTimes(1);

    vi.setSystemTime(new Date("2023-10-09T10:00z"));
    // configuration et suppression ERP
    await app.requestAsUser("user1@tdb.local", "post", `/api/v1/organismes/${userOrganisme._id}/configure-erp`, {
      mode_de_transmission: "API",
      erps: ["ymag"],
    });
    await app.requestAsUser("user1@tdb.local", "delete", `/api/v1/organismes/${userOrganisme._id}/configure-erp`);

    vi.setSystemTime(new Date("2023-10-10T10:00z"));
    await sendReminderEmails();
    // 1 nouveau mail envoyé car état de relance réinitialisé pour user 1
    expect(sendEmail).toHaveBeenCalledTimes(2);

    vi.setSystemTime(new Date("2023-10-11T10:00z"));
    await sendReminderEmails();
    // 1 nouveau mail envoyé car >= 7j et 1ère relance pour user 2
    expect(sendEmail).toHaveBeenCalledTimes(3);

    vi.setSystemTime(new Date("2023-10-12T10:00z"));
    await sendReminderEmails();
    // 0 nouveau mail envoyé car relances déjà envoyées
    expect(sendEmail).toHaveBeenCalledTimes(3);
  });
});

async function createUser(user: { email: string; createdAt: string }) {
  await usersMigrationDb().insertOne({
    _id: new ObjectId(),
    account_status: "CONFIRMED",
    password_updated_at: new Date(),
    connection_history: [],
    emails: [],
    created_at: new Date(user.createdAt),
    civility: "Madame",
    nom: "Dupont",
    prenom: "Jean",
    fonction: "Responsable administratif",
    email: user.email,
    telephone: "",
    password: testPasswordHash,
    has_accept_cgu_version: "v0.1",
    organisation_id: userOrganisme._id,
  });
}
