import { strict as assert } from "assert";
import { createJobEvent } from "../../../../src/common/actions/jobEvents.actions.js";
import { createUserEvent } from "../../../../src/common/actions/userEvents.actions.js";
import { jobEventStatuts } from "../../../../src/common/constants/jobsConstants.js";
import { jobEventsDb, userEventsDb } from "../../../../src/common/model/collections.js";
import { clearAllCollections, clearCollection } from "../../../../src/common/mongodb.js";
import jobEventsModelDescriptor from "../../../../src/common/model/jobEvents.model.js";

describe("Mongodb Tests", () => {
  describe("clearAllCollections", () => {
    it("Vérifie la suppression de toutes les collections", async () => {
      // Create sample data
      await createJobEvent({
        jobname: "testJobName",
        action: jobEventStatuts.started,
      });

      await createUserEvent({
        username: "admin",
        user_email: "admin@test.fr",
        type: "any",
        action: "test",
        data: { hello: "world" },
        date: new Date(),
      });

      const countJobEvents = await jobEventsDb().countDocuments();
      const countUserEvents = await userEventsDb().countDocuments();
      assert.equal(countJobEvents, 1);
      assert.equal(countUserEvents, 1);

      await clearAllCollections();

      const countJobEventsAfterClear = await jobEventsDb().countDocuments();
      const countUserEventsAfterClear = await userEventsDb().countDocuments();
      assert.equal(countJobEventsAfterClear, 0);
      assert.equal(countUserEventsAfterClear, 0);
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
