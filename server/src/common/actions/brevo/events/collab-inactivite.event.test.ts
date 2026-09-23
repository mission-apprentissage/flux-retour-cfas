import { ObjectId } from "bson";
import type { IOrganisation } from "shared/models/data/organisations.model";
import type { IOrganisme } from "shared/models/data/organismes.model";
import type { IUsersMigration } from "shared/models/data/usersMigration.model";
import { generateOrganismeFixture } from "shared/models/fixtures/organisme.fixture";
import { beforeEach, describe, expect, it } from "vitest";

import { organisationsDb, organismesDb, usersMigrationDb } from "@/common/model/collections";
import { useMongo } from "@tests/jest/setupMongo";
import { testDoc } from "@tests/utils/testUtils";

import { buildOrgaMl, buildOrgaOf, buildUser } from "../contacts/fixtures";

import { collabInactiviteEvent } from "./collab-inactivite.event";

useMongo();

const emailSentAt = new Date("2026-09-10T07:00:00.000Z");

describe("collab-inactivite.event", () => {
  let organisme: IOrganisme;
  let orga: ReturnType<typeof buildOrgaOf>;

  beforeEach(async () => {
    organisme = generateOrganismeFixture({
      siret: "19040492100016",
      uai: "0802004U",
      enseigne: "CFA DES METIERS",
      raison_sociale: "ASSOCIATION CFA",
      collab_inactivity_email_sent_at: emailSentAt,
    });
    await organismesDb().insertOne(organisme, { bypassDocumentValidation: true });
    orga = buildOrgaOf({ organisme_id: organisme._id.toString(), siret: organisme.siret, uai: organisme.uai });
    await organisationsDb().insertOne(testDoc<IOrganisation>(orga));
  });

  it("construit le payload avec le nom du CFA, la date limite à J+5 et l'url de connexion", async () => {
    const user = buildUser(orga);
    await usersMigrationDb().insertOne(testDoc<IUsersMigration>(user));

    const payload = await collabInactiviteEvent.buildPayload({ userId: user._id.toString() });

    expect(payload).toEqual({
      identifiers: { emailId: user.email },
      eventProperties: {
        nom_cfa: "CFA DES METIERS",
        date_limite: "15/09/2026",
        url_connexion: expect.stringMatching(/\/auth\/connexion$/),
      },
    });
  });

  it("renvoie null pour un compte non confirmé", async () => {
    const user = buildUser(orga, { account_status: "PENDING_ADMIN_VALIDATION" });
    await usersMigrationDb().insertOne(testDoc<IUsersMigration>(user));

    expect(await collabInactiviteEvent.buildPayload({ userId: user._id.toString() })).toBeNull();
  });

  it("renvoie null pour un compte désinscrit", async () => {
    const user = buildUser(orga, { unsubscribe: true });
    await usersMigrationDb().insertOne(testDoc<IUsersMigration>(user));

    expect(await collabInactiviteEvent.buildPayload({ userId: user._id.toString() })).toBeNull();
  });

  it("renvoie null pour un membre d'une Mission Locale", async () => {
    const ml = buildOrgaMl("ML Test");
    await organisationsDb().insertOne(testDoc<IOrganisation>(ml));
    const user = buildUser(ml);
    await usersMigrationDb().insertOne(testDoc<IUsersMigration>(user));

    expect(await collabInactiviteEvent.buildPayload({ userId: user._id.toString() })).toBeNull();
  });

  it("renvoie null si la relance a été levée entre l'enqueue et l'envoi", async () => {
    await organismesDb().updateOne({ _id: organisme._id }, { $unset: { collab_inactivity_email_sent_at: "" } });
    const user = buildUser(orga);
    await usersMigrationDb().insertOne(testDoc<IUsersMigration>(user));

    expect(await collabInactiviteEvent.buildPayload({ userId: user._id.toString() })).toBeNull();
  });

  it("renvoie null pour un utilisateur inconnu", async () => {
    expect(await collabInactiviteEvent.buildPayload({ userId: new ObjectId().toString() })).toBeNull();
  });
});
