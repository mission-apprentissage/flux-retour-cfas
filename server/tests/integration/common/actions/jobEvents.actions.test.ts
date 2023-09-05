import { strict as assert } from "assert";

import { addMinutes } from "date-fns";

import { createJobEvent, isJobInAction } from "@/common/actions/jobEvents.actions";
import { jobEventStatuts } from "@/common/constants/jobs";
import { useMongo } from "@tests/jest/setupMongo";

describe("Test des actions JobEvents", () => {
  useMongo();
  it("Permet de vérifier si le job courant est dans l'action terminée", async () => {
    const testJobName = "TEST-JOB";

    const currentDate = new Date();
    const currentDateAfterFiveMinutes = addMinutes(currentDate, 5);
    const currentDateAfterTenMinutes = addMinutes(currentDate, 10);

    // Add started event
    await createJobEvent({
      jobname: testJobName,
      action: jobEventStatuts.started,
      date: currentDate,
    });

    // Add executed event
    await createJobEvent({
      jobname: testJobName,
      action: jobEventStatuts.executed,
      date: currentDateAfterFiveMinutes,
    });

    // Add ended event
    await createJobEvent({
      jobname: testJobName,
      action: jobEventStatuts.ended,
      date: currentDateAfterTenMinutes,
    });

    const isEnded = await isJobInAction(testJobName, jobEventStatuts.ended);
    assert.equal(isEnded, true);
  });

  it("Permet de vérifier si le job courant n'est pas dans l'action terminée", async () => {
    const testJobName = "TEST-JOB";

    const currentDate = new Date();
    const currentDateAfterFiveMinutes = addMinutes(currentDate, 5);

    // Add started event
    await createJobEvent({
      jobname: testJobName,
      action: jobEventStatuts.started,
      date: currentDate,
    });

    // Add executed event
    await createJobEvent({
      jobname: testJobName,
      action: jobEventStatuts.executed,
      date: currentDateAfterFiveMinutes,
    });

    const isEnded = await isJobInAction(testJobName, jobEventStatuts.ended);
    assert.equal(isEnded, false);
  });
});
