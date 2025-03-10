import { effectifsDb, organismesDb } from "@/common/model/collections";
import { migrateEffectif } from "@/jobs/ingestion/process-ingestion.v2";

export const up = async () => {
  const organismes = await organismesDb().find({}).toArray();
  const organismeLookup = new Map(organismes.map((o) => [o._id.toHexString(), o]));

  const cursor = effectifsDb().find({}, { sort: { transmitted_at: 1, updated_at: 1 }, timeout: false });

  let counter = 0;
  for await (const effectif of cursor) {
    await migrateEffectif(effectif, organismeLookup);
    counter++;
    if (counter % 1_000 === 0) {
      console.log(`${new Date().toJSON()}: Migrated ${counter} effectifs`);
    }
  }
};
