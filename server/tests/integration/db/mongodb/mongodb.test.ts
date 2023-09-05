import { strict as assert } from "assert";

import { createJobEvent } from "@/common/actions/jobEvents.actions";
import { jobEventStatuts } from "@/common/constants/jobs";
import { jobEventsDb } from "@/common/model/collections";
import jobEventsModelDescriptor from "@/common/model/jobEvents.model";
import { clearAllCollections, clearCollection } from "@/common/mongodb";
import { useMongo } from "@tests/jest/setupMongo";

describe("Mongodb Tests", () => {
  useMongo();
  describe("clearAllCollections", () => {
    it("Vérifie la suppression de toutes les collections", async () => {
      // Create sample data
      await createJobEvent({
        jobname: "testJobName",
        action: jobEventStatuts.started,
      });

      const countJobEvents = await jobEventsDb().countDocuments();
      assert.equal(countJobEvents, 1);

      await clearAllCollections();

      const countJobEventsAfterClear = await jobEventsDb().countDocuments();
      assert.equal(countJobEventsAfterClear, 0);
    });
  });

  describe("clearCollection", () => {
    it("Vérifie la suppression d'une collection", async () => {
      // Create sample data
      await createJobEvent({
        jobname: "testJobName",
        action: jobEventStatuts.started,
      });

      const countJobEvents = await jobEventsDb().countDocuments();
      assert.equal(countJobEvents, 1);

      await clearCollection(jobEventsModelDescriptor.collectionName);

      const countJobEventsAfterClear = await jobEventsDb().countDocuments();
      assert.equal(countJobEventsAfterClear, 0);
    });
  });
});
