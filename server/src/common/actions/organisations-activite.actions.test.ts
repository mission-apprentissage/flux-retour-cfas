import { ObjectId } from "bson";
import { describe, expect, it } from "vitest";

import { organisationsDb } from "@/common/model/collections";
import { useMongo } from "@tests/jest/setupMongo";

import { enregistrerActiviteOrganisation } from "./organisations-activite.actions";

useMongo();

const insertOrganisation = async (type: string, fields: Record<string, unknown> = {}) => {
  const _id = new ObjectId();
  await organisationsDb().insertOne({ _id, type, created_at: new Date(), ...fields } as never, {
    bypassDocumentValidation: true,
  });
  return _id;
};

const insertCfa = () =>
  insertOrganisation("ORGANISME_FORMATION", {
    siret: "19040492100016",
    uai: null,
    organisme_id: new ObjectId().toHexString(),
  });

const derniereActivite = async (id: ObjectId) =>
  ((await organisationsDb().findOne({ _id: id })) as { derniere_activite?: Date } | null)?.derniere_activite;

describe("enregistrerActiviteOrganisation", () => {
  const t0 = new Date("2026-10-19T10:00:00.000Z");
  const plus = (minutes: number) => new Date(t0.getTime() + minutes * 60 * 1000);

  it("enregistre l'activité d'un CFA, sans la réécrire avant 5 minutes", async () => {
    const cfa = await insertCfa();

    await enregistrerActiviteOrganisation({}, cfa, t0);
    expect(await derniereActivite(cfa)).toEqual(t0);

    await enregistrerActiviteOrganisation({}, cfa, plus(4));
    expect(await derniereActivite(cfa)).toEqual(t0);

    await enregistrerActiviteOrganisation({}, cfa, plus(6));
    expect(await derniereActivite(cfa)).toEqual(plus(6));
  });

  it("enregistre l'activité d'une Mission Locale", async () => {
    const ml = await insertOrganisation("MISSION_LOCALE", { nom: "ML", ml_id: 9301 });

    await enregistrerActiviteOrganisation({}, ml, t0);

    expect(await derniereActivite(ml)).toEqual(t0);
  });

  it("ignore l'imposture d'un administrateur et les organisations qui ne sont ni ML ni CFA", async () => {
    const cfa = await insertCfa();
    const admin = await insertOrganisation("ADMINISTRATEUR");

    await enregistrerActiviteOrganisation({ impersonating: true }, cfa, t0);
    await enregistrerActiviteOrganisation({}, admin, t0);

    expect(await derniereActivite(cfa)).toBeUndefined();
    expect(await derniereActivite(admin)).toBeUndefined();
  });
});
