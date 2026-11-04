import { ObjectId } from "bson";
import { describe, expect, it } from "vitest";

import { usersMigrationDb } from "@/common/model/collections";
import { up } from "@/db/migrations/20261103150000-emails-comptes-en-minuscules";
import { useMongo } from "@tests/jest/setupMongo";
import { testPasswordHash } from "@tests/utils/testUtils";

useMongo();

const insererCompte = async (email: string) => {
  const _id = new ObjectId();
  await usersMigrationDb().insertOne({
    _id,
    email,
    password: testPasswordHash,
    nom: "Dupont",
    prenom: "Jean",
    organisation_id: new ObjectId(),
    account_status: "CONFIRMED",
    connection_history: [],
    emails: [],
    created_at: new Date(),
  });
  return _id;
};

const emailDe = async (_id: ObjectId) => (await usersMigrationDb().findOne({ _id }))?.email;

describe("migration emails-comptes-en-minuscules", () => {
  it("met en minuscules et sans espaces l'e-mail d'un compte", async () => {
    const compte = await insererCompte(" Direction@CFA-exemple.fr ");

    await up();

    expect(await emailDe(compte)).toBe("direction@cfa-exemple.fr");
  });

  it("laisse un compte dont l'e-mail en minuscules appartient déjà à un autre compte", async () => {
    const enMinuscules = await insererCompte("contact@cfa-exemple.fr");
    const enMajuscules = await insererCompte("Contact@CFA-exemple.fr");

    await up();

    expect(await emailDe(enMinuscules)).toBe("contact@cfa-exemple.fr");
    expect(await emailDe(enMajuscules)).toBe("Contact@CFA-exemple.fr");
  });

  it("ne touche pas un e-mail déjà en minuscules", async () => {
    const compte = await insererCompte("accueil@cfa-exemple.fr");
    const avant = await usersMigrationDb().findOne({ _id: compte });

    await up();

    expect(await usersMigrationDb().findOne({ _id: compte })).toStrictEqual(avant);
  });
});
