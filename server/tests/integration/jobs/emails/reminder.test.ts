import { ObjectId } from "bson";
import { advanceTo } from "jest-date-mock";

import { organisationsDb, organismesDb, usersMigrationDb } from "@/common/model/collections";
import { sendEmail } from "@/common/services/mailer/mailer";
import { sendReminderEmails } from "@/jobs/emails/reminder";
import { useMongo } from "@tests/jest/setupMongo";
import { userOrganisme } from "@tests/utils/permissions";
import { id, testPasswordHash } from "@tests/utils/testUtils";

describe("Job send-reminder-emails", () => {
  useMongo();

  beforeEach(() => {
    import.meta.jest.clearAllMocks();
  });

  describe("relance après 7 jours si pas de configuration ni de données", () => {
    it("envoi d'un email 7j après la création d'un utilisateur et seulement 1 fois", async () => {
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
        usersMigrationDb().insertOne({
          _id: new ObjectId(id(1)),
          account_status: "CONFIRMED",
          invalided_token: false,
          password_updated_at: new Date(),
          connection_history: [],
          emails: [],
          created_at: new Date("2023-10-16T10:00z"),
          civility: "Madame",
          nom: "Dupont",
          prenom: "Jean",
          fonction: "Responsable administratif",
          email: "relance@tdb.local",
          telephone: "",
          password: testPasswordHash,
          has_accept_cgu_version: "v0.1",
          organisation_id: userOrganisme._id,
        }),
      ]);

      advanceTo("2023-10-23T08:00z");
      await sendReminderEmails();
      // 0 mail envoyé car < 7j
      expect(sendEmail).toHaveBeenCalledTimes(0);

      advanceTo("2023-10-23T12:00z");
      await sendReminderEmails();
      expect(sendEmail).toHaveBeenCalledTimes(1);
      // 1 mail envoyé car >= 7j et 1ère relance

      advanceTo("2023-10-24T12:00z");
      await sendReminderEmails();
      // 0 mail envoyé car relance déjà envoyée
      expect(sendEmail).toHaveBeenCalledTimes(1);
    });
  });

  describe("relance après 7 jours si organisme configuré mais pas de données", () => {
    it("envoi d'un email 7j après la configuration et seulement 1 fois", async () => {
      const { last_transmission_date, ...organisme } = userOrganisme;
      await Promise.all([
        organismesDb().insertOne({
          ...organisme,
          erps: ["ymag"],
          mode_de_transmission: "API",
          mode_de_transmission_configuration_date: new Date("2023-10-20T10:00z"),
          mode_de_transmission_configuration_author_fullname: "Jean Dupont",
        }),
        organisationsDb().insertOne({
          _id: userOrganisme._id,
          type: "ORGANISME_FORMATION",
          siret: userOrganisme.siret,
          uai: userOrganisme.uai ?? null,
          created_at: new Date(),
        }),
        usersMigrationDb().insertOne({
          _id: new ObjectId(id(1)),
          account_status: "CONFIRMED",
          invalided_token: false,
          password_updated_at: new Date(),
          connection_history: [],
          emails: [],
          created_at: new Date("2023-10-16T10:00z"),
          civility: "Madame",
          nom: "Dupont",
          prenom: "Jean",
          fonction: "Responsable administratif",
          email: "relance@tdb.local",
          telephone: "",
          password: testPasswordHash,
          has_accept_cgu_version: "v0.1",
          organisation_id: userOrganisme._id,
        }),
      ]);

      advanceTo("2023-10-27T08:00z");
      await sendReminderEmails();
      // 0 mail envoyé car < 7j
      expect(sendEmail).toHaveBeenCalledTimes(0);

      advanceTo("2023-10-27T12:00z");
      await sendReminderEmails();
      expect(sendEmail).toHaveBeenCalledTimes(1);
      // 1 mail envoyé car >= 7j et 1ère relance

      advanceTo("2023-10-28T12:00z");
      await sendReminderEmails();
      // 0 mail envoyé car relance déjà envoyée
      expect(sendEmail).toHaveBeenCalledTimes(1);
    });
  });
});
