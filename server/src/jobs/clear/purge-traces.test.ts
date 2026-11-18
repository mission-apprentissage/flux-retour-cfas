import { ObjectId } from "mongodb";
import type { IUsersMigration } from "shared/models";
import { describe, expect, it } from "vitest";

import { usersMigrationDb } from "@/common/model/collections";
import { useMongo } from "@tests/jest/setupMongo";
import { testPasswordHash } from "@tests/utils/testUtils";

import { purgeTraces } from "./purge-traces";

useMongo();

const MAINTENANT = new Date("2026-11-18T10:00:00.000Z");

const joursAvant = (jours: number) => new Date(MAINTENANT.getTime() - jours * 24 * 60 * 60 * 1000);

const insererCompte = async (fields: Partial<IUsersMigration>) => {
  const _id = new ObjectId();
  await usersMigrationDb().insertOne({
    _id,
    email: `${_id.toString()}@cfa.fr`,
    password: testPasswordHash,
    nom: "Dupont",
    prenom: "Jean",
    organisation_id: new ObjectId(),
    account_status: "CONFIRMED",
    created_at: joursAvant(900),
    ...fields,
  });
  return _id;
};

const courriel = (token: string, sendDates: Date[], payload?: unknown) => ({
  token,
  templateName: "activation_cfa",
  sendDates,
  ...(payload === undefined ? {} : { payload }),
});

const lireCompte = (_id: ObjectId) => usersMigrationDb().findOne({ _id });

describe("purgeTraces", () => {
  it("retire les dates de connexion de plus de 12 mois et garde les autres", async () => {
    const _id = await insererCompte({
      last_connection: joursAvant(10),
      connection_history: [joursAvant(400), joursAvant(366), joursAvant(364), joursAvant(10)],
    });
    const recent = await insererCompte({ connection_history: [joursAvant(10)] });

    await purgeTraces(MAINTENANT);
    await purgeTraces(MAINTENANT);

    expect((await lireCompte(_id))?.connection_history).toEqual([joursAvant(364), joursAvant(10)]);
    expect((await lireCompte(_id))?.last_connection).toEqual(joursAvant(10));
    expect((await lireCompte(recent))?.connection_history).toEqual([joursAvant(10)]);
  });

  it("retire les courriels envoyés il y a plus de 12 mois et garde ceux renvoyés depuis", async () => {
    const _id = await insererCompte({
      emails: [
        courriel("ancien", [joursAvant(400)], { prenom: "Jean" }),
        courriel("renvoye", [joursAvant(400), joursAvant(10)], { prenom: "Jean" }),
        courriel("recent", [joursAvant(10)], { prenom: "Jean" }),
      ],
    });

    await purgeTraces(MAINTENANT);
    await purgeTraces(MAINTENANT);

    expect((await lireCompte(_id))?.emails?.map(({ token }) => token)).toEqual(["renvoye", "recent"]);
  });

  it("retire la charge utile des courriels envoyés il y a plus de 30 jours", async () => {
    const _id = await insererCompte({
      emails: [
        courriel("ancien", [joursAvant(60)], { prenom: "Jean" }),
        courriel("sans-charge", [joursAvant(60)]),
        courriel("renvoye", [joursAvant(60), joursAvant(10)], { prenom: "Jean" }),
        courriel("recent", [joursAvant(10)], { prenom: "Jean" }),
      ],
    });

    await purgeTraces(MAINTENANT);
    await purgeTraces(MAINTENANT);

    expect((await lireCompte(_id))?.emails).toEqual([
      courriel("ancien", [joursAvant(60)]),
      courriel("sans-charge", [joursAvant(60)]),
      courriel("renvoye", [joursAvant(60), joursAvant(10)], { prenom: "Jean" }),
      courriel("recent", [joursAvant(10)], { prenom: "Jean" }),
    ]);
  });

  it("ne modifie plus aucun compte au second passage", async () => {
    await insererCompte({
      connection_history: [joursAvant(400)],
      emails: [courriel("ancien", [joursAvant(400)]), courriel("charge", [joursAvant(60)], { prenom: "Jean" })],
    });

    expect(await purgeTraces(MAINTENANT)).toEqual({ connection_history: 1, emails: 1, payload: 1 });
    expect(await purgeTraces(MAINTENANT)).toEqual({ connection_history: 0, emails: 0, payload: 0 });
  });
});
