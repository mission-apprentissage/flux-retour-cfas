import { ObjectId } from "bson";
import { SITUATION_ENUM } from "shared/models/data/missionLocaleEffectif.model";
import { MISSION_LOCALE_LOG_EVENT } from "shared/models/data/missionLocaleEffectifLog.model";
import { it, expect, describe, beforeEach } from "vitest";

import { missionLocaleEffectifsDb, missionLocaleEffectifsLogDb } from "@/common/model/collections";
import { getDatabase } from "@/common/mongodb";
import { backfillMlSuiviDates } from "@/jobs/migration/backfill-ml-suivi-dates";
import { useMongo } from "@tests/jest/setupMongo";

const ML_ID = new ObjectId();

const NOW = Date.now();
const daysAgo = (days: number) => new Date(NOW - days * 24 * 60 * 60 * 1000);

function createMlEffectifDoc(overrides: Record<string, unknown> = {}) {
  return {
    _id: new ObjectId(),
    mission_locale_id: ML_ID,
    effectif_id: new ObjectId(),
    created_at: daysAgo(90),
    updated_at: daysAgo(30),
    ...overrides,
  };
}

function createLogDoc(
  effectifDocId: ObjectId,
  overrides: { situation?: SITUATION_ENUM | null; event?: string; created_at: Date; created_by?: ObjectId | null }
) {
  return {
    _id: new ObjectId(),
    mission_locale_effectif_id: effectifDocId,
    situation: overrides.situation ?? null,
    ...(overrides.event ? { event: overrides.event } : {}),
    created_at: overrides.created_at,
    created_by: overrides.created_by ?? new ObjectId(),
    read_by: [],
  };
}

describe("backfillMlSuiviDates", () => {
  useMongo();

  beforeEach(async () => {
    await getDatabase().command({ collMod: "missionLocaleEffectif", validationLevel: "off" });
  });

  it("recalcule les trois dates depuis les logs d'un dossier traité", async () => {
    const doc = createMlEffectifDoc({ situation: SITUATION_ENUM.RDV_PRIS });
    await missionLocaleEffectifsDb().insertOne(doc as any);
    await missionLocaleEffectifsLogDb().insertMany([
      createLogDoc(doc._id, { situation: SITUATION_ENUM.CONTACTE_SANS_RETOUR, created_at: daysAgo(20) }),
      createLogDoc(doc._id, { situation: SITUATION_ENUM.RDV_PRIS, created_at: daysAgo(10) }),
      // événement WhatsApp postérieur : ne compte pas comme action ML
      createLogDoc(doc._id, {
        situation: null,
        event: MISSION_LOCALE_LOG_EVENT.WHATSAPP_YES_HELP,
        created_at: daysAgo(1),
        created_by: null,
      }),
    ] as any);

    await backfillMlSuiviDates();

    const after = await missionLocaleEffectifsDb().findOne({ _id: doc._id });
    expect(after?.date_traitement).toEqual(daysAgo(10));
    expect(after?.date_dernier_passage_a_recontacter).toEqual(daysAgo(20));
    expect(after?.date_derniere_action_ml).toEqual(daysAgo(10));
  });

  it("ne pose pas date_traitement sur un dossier actuellement à recontacter", async () => {
    const doc = createMlEffectifDoc({ situation: SITUATION_ENUM.CONTACTE_SANS_RETOUR });
    await missionLocaleEffectifsDb().insertOne(doc as any);
    await missionLocaleEffectifsLogDb().insertMany([
      createLogDoc(doc._id, { situation: SITUATION_ENUM.RDV_PRIS, created_at: daysAgo(15) }),
      createLogDoc(doc._id, { situation: SITUATION_ENUM.CONTACTE_SANS_RETOUR, created_at: daysAgo(5) }),
    ] as any);

    await backfillMlSuiviDates();

    const after = await missionLocaleEffectifsDb().findOne({ _id: doc._id });
    expect(after?.date_traitement ?? null).toBeNull();
    expect(after?.date_dernier_passage_a_recontacter).toEqual(daysAgo(5));
    expect(after?.date_derniere_action_ml).toEqual(daysAgo(5));
  });

  it("laisse un dossier à traiter sans logs intact", async () => {
    const doc = createMlEffectifDoc({ situation: null });
    await missionLocaleEffectifsDb().insertOne(doc as any);

    await backfillMlSuiviDates();

    const after = await missionLocaleEffectifsDb().findOne({ _id: doc._id });
    expect(after?.date_traitement ?? null).toBeNull();
    expect(after?.date_dernier_passage_a_recontacter ?? null).toBeNull();
    expect(after?.date_derniere_action_ml ?? null).toBeNull();
  });

  it("replie date_traitement sur updated_at pour un dossier traité sans log", async () => {
    const doc = createMlEffectifDoc({ situation: SITUATION_ENUM.NOUVEAU_CONTRAT, updated_at: daysAgo(12) });
    await missionLocaleEffectifsDb().insertOne(doc as any);

    await backfillMlSuiviDates();

    const after = await missionLocaleEffectifsDb().findOne({ _id: doc._id });
    expect(after?.date_traitement).toEqual(daysAgo(12));
    expect(after?.date_derniere_action_ml ?? null).toBeNull();
  });

  it("un traitement automatique WhatsApp pose date_traitement mais pas la date d'action ML", async () => {
    const doc = createMlEffectifDoc({ situation: SITUATION_ENUM.NE_SOUHAITE_PAS_ETRE_RECONTACTE });
    await missionLocaleEffectifsDb().insertOne(doc as any);
    await missionLocaleEffectifsLogDb().insertOne(
      createLogDoc(doc._id, {
        situation: SITUATION_ENUM.NE_SOUHAITE_PAS_ETRE_RECONTACTE,
        event: MISSION_LOCALE_LOG_EVENT.WHATSAPP_NO_HELP,
        created_at: daysAgo(3),
        created_by: null,
      }) as any
    );

    await backfillMlSuiviDates();

    const after = await missionLocaleEffectifsDb().findOne({ _id: doc._id });
    expect(after?.date_traitement).toEqual(daysAgo(3));
    expect(after?.date_derniere_action_ml ?? null).toBeNull();
  });

  it("ne réécrit pas une date déjà posée au fil de l'eau", async () => {
    const dateRuntime = daysAgo(2);
    const doc = createMlEffectifDoc({
      situation: SITUATION_ENUM.RDV_PRIS,
      date_traitement: dateRuntime,
      date_derniere_action_ml: dateRuntime,
    });
    await missionLocaleEffectifsDb().insertOne(doc as any);
    await missionLocaleEffectifsLogDb().insertOne(
      createLogDoc(doc._id, { situation: SITUATION_ENUM.RDV_PRIS, created_at: daysAgo(40) }) as any
    );

    await backfillMlSuiviDates();

    const after = await missionLocaleEffectifsDb().findOne({ _id: doc._id });
    expect(after?.date_traitement).toEqual(dateRuntime);
    expect(after?.date_derniere_action_ml).toEqual(dateRuntime);
  });

  it("est idempotent", async () => {
    const doc = createMlEffectifDoc({ situation: SITUATION_ENUM.RDV_PRIS });
    await missionLocaleEffectifsDb().insertOne(doc as any);
    await missionLocaleEffectifsLogDb().insertOne(
      createLogDoc(doc._id, { situation: SITUATION_ENUM.RDV_PRIS, created_at: daysAgo(10) }) as any
    );

    await backfillMlSuiviDates();
    const first = await missionLocaleEffectifsDb().findOne({ _id: doc._id });
    await backfillMlSuiviDates();
    const second = await missionLocaleEffectifsDb().findOne({ _id: doc._id });

    expect(second?.date_traitement).toEqual(first?.date_traitement);
    expect(second?.date_derniere_action_ml).toEqual(first?.date_derniere_action_ml);
  });
});
