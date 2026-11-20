import { ObjectId } from "mongodb";
import { describe, expect, it } from "vitest";

import { getAllEffectifs } from "@/common/actions/effectifs/effectifs.actions";
import { effectifsDb, organismesDb } from "@/common/model/collections";
import { createRandomOrganisme, createSampleEffectif } from "@tests/data/randomizedSample";
import { useMongo } from "@tests/jest/setupMongo";

useMongo();

describe("getAllEffectifs", () => {
  it("liste les effectifs paginés avec leur organisme", async () => {
    const organisme = { _id: new ObjectId(), ...createRandomOrganisme() };
    await organismesDb().insertOne(organisme);
    await effectifsDb().insertMany([
      { _id: new ObjectId(), ...(await createSampleEffectif({ organisme })) },
      { _id: new ObjectId(), ...(await createSampleEffectif({ organisme })) },
    ]);

    const result = await getAllEffectifs({}, { page: 1, limit: 10, sort: { created_at: -1 } });

    expect(result?.pagination).toMatchObject({ total: 2, page: 1, limit: 10, lastPage: 1 });
    expect(result?.data).toHaveLength(2);
    expect(result?.data[0].organisme._id).toEqual(organisme._id);
  });
});
