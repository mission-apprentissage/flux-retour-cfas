import { ObjectId } from "bson";
import { describe, expect, it } from "vitest";

import { computedOrganismeMl } from "@/common/actions/mission-locale/mission-locale.actions";
import { opcosRncpDb, organismesDb } from "@/common/model/collections";
import { cachedInRun, withRunCache } from "@/common/utils/runCache";
import { createRandomOrganisme } from "@tests/data/randomizedSample";
import { useMongo } from "@tests/jest/setupMongo";

describe("cache de lecture d'un run DECA", () => {
  useMongo();

  const insererOrganisme = async (isAllowedCollab: boolean) => {
    const organisme = { ...createRandomOrganisme(), _id: new ObjectId(), is_allowed_collab: isAllowedCollab };
    await organismesDb().insertOne(organisme);
    return organisme;
  };

  it("relit la base à chaque appel hors d'un run", async () => {
    const organisme = await insererOrganisme(false);

    expect((await computedOrganismeMl(organisme._id)).is_allowed_collab).toBe(false);
    await organismesDb().updateOne({ _id: organisme._id }, { $set: { is_allowed_collab: true } });

    expect((await computedOrganismeMl(organisme._id)).is_allowed_collab).toBe(true);
  });

  it("garde la première lecture pendant un run", async () => {
    const organisme = await insererOrganisme(false);

    const [avant, apres] = await withRunCache(async () => {
      const premiere = await computedOrganismeMl(organisme._id);
      await organismesDb().updateOne({ _id: organisme._id }, { $set: { is_allowed_collab: true } });
      return [premiere, await computedOrganismeMl(organisme._id)];
    });

    expect(avant.is_allowed_collab).toBe(false);
    expect(apres).toEqual(avant);
    expect((await computedOrganismeMl(organisme._id)).is_allowed_collab).toBe(true);
  });

  it("mémorise une liste d'OPCO vide mais pas un organisme introuvable", async () => {
    const lectures = { opcos: 0, organisme: 0 };

    await withRunCache(async () => {
      for (let i = 0; i < 3; i++) {
        await cachedInRun("opcos-rncp:RNCP_INCONNU", async () => {
          lectures.opcos++;
          return opcosRncpDb().find({ "_computed.rncp.code": "RNCP_INCONNU" }).toArray();
        });
        await cachedInRun("organisme:inconnu", async () => {
          lectures.organisme++;
          return organismesDb().findOne({ _id: new ObjectId() });
        });
      }
    });

    expect(lectures).toEqual({ opcos: 1, organisme: 3 });
  });
});
