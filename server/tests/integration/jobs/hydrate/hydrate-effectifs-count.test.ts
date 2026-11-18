import { ObjectId } from "mongodb";
import { getActiveAnneesScolaires } from "shared/utils/anneeScolaire";
import { describe, expect, it } from "vitest";

import { effectifsDb, effectifsDECADb, organismesDb } from "@/common/model/collections";
import { hydrateOrganismesEffectifsCount } from "@/jobs/hydrate/organismes/hydrate-effectifs_count";
import { useMongo } from "@tests/jest/setupMongo";

const [ANNEE_COURANTE, ANNEE_PRECEDENTE] = getActiveAnneesScolaires(new Date());
const debut = Number(ANNEE_PRECEDENTE.split("-")[0]);
const ANNEE_ANCIENNE = `${debut - 1}-${debut}`;
const UPDATED_AT = new Date("2026-01-01T00:00:00.000Z");

const insererOrganisme = async () => {
  const _id = new ObjectId();
  await organismesDb().insertOne(
    { _id, uai: "0000000A", siret: "00000000000000", created_at: UPDATED_AT, updated_at: UPDATED_AT } as never,
    { bypassDocumentValidation: true }
  );
  return _id;
};

const insererLignes = async (
  db: typeof effectifsDb | typeof effectifsDECADb,
  organisme_id: ObjectId,
  annees: string[]
) => {
  await db().insertMany(
    annees.map((annee_scolaire) => ({ _id: new ObjectId(), organisme_id, annee_scolaire }) as never),
    { bypassDocumentValidation: true }
  );
};

const organisme = (_id: ObjectId) => organismesDb().findOne({ _id });

describe("Job hydrateOrganismesEffectifsCount", () => {
  useMongo();

  it("Compte les effectifs ERP de l'année en cours et de la précédente, pas ceux d'avant", async () => {
    const id = await insererOrganisme();
    await insererLignes(effectifsDb, id, [ANNEE_COURANTE, ANNEE_PRECEDENTE, ANNEE_ANCIENNE]);

    await hydrateOrganismesEffectifsCount();

    expect(await organisme(id)).toMatchObject({ effectifs_annees_actives_count: 2, effectifs_count: 3 });
  });

  it("Additionne les effectifs ERP et les lignes DECA", async () => {
    const id = await insererOrganisme();
    await insererLignes(effectifsDb, id, [ANNEE_COURANTE]);
    await insererLignes(effectifsDECADb, id, [ANNEE_PRECEDENTE, ANNEE_PRECEDENTE, ANNEE_ANCIENNE]);

    await hydrateOrganismesEffectifsCount();

    expect((await organisme(id))?.effectifs_annees_actives_count).toBe(3);
  });

  it("Écrit 0 pour un organisme sans effectif et remet à 0 un compteur périmé", async () => {
    const sansEffectif = await insererOrganisme();
    const perime = await insererOrganisme();
    await organismesDb().updateOne(
      { _id: perime },
      { $set: { effectifs_annees_actives_count: 12 } },
      { bypassDocumentValidation: true }
    );
    await insererLignes(effectifsDECADb, perime, [ANNEE_ANCIENNE]);

    await hydrateOrganismesEffectifsCount();

    expect((await organisme(sansEffectif))?.effectifs_annees_actives_count).toBe(0);
    expect((await organisme(perime))?.effectifs_annees_actives_count).toBe(0);
  });

  it("Ne modifie pas updated_at", async () => {
    const id = await insererOrganisme();
    await insererLignes(effectifsDECADb, id, [ANNEE_COURANTE]);

    await hydrateOrganismesEffectifsCount();

    expect((await organisme(id))?.updated_at).toEqual(UPDATED_AT);
  });
});
