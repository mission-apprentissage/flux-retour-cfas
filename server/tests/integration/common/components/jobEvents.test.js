const assert = require("assert").strict;
const jobEvents = require("../../../../src/common/components/jobEvents");
const { JobEventModel } = require("../../../../src/common/model");
const { jobEventStatuts } = require("../../../../src/common/model/constants");

describe(__filename, () => {
  it("Permet de vérifier si le job courant est dans l'action terminée", async () => {
    const { isJobInAction } = await jobEvents();

    const testJobName = "TEST-JOB";
    // Add started event
    await new JobEventModel({
      jobname: testJobName,
      action: jobEventStatuts.started,
    }).save();

    // Add executed event
    await new JobEventModel({
      jobname: testJobName,
      action: jobEventStatuts.executed,
    }).save();

    // Add ended event
    await new JobEventModel({
      jobname: testJobName,
      action: jobEventStatuts.ended,
    }).save();

    const isEnded = await isJobInAction(testJobName, jobEventStatuts.ended);
    assert.equal(isEnded, true);
  });

  it("Permet de vérifier si le job courant n'est pas dans l'action terminée", async () => {
    const { isJobInAction } = await jobEvents();

    const testJobName = "TEST-JOB";
    // Add started event
    await new JobEventModel({
      jobname: testJobName,
      action: jobEventStatuts.started,
    }).save();

    // Add executed event
    await new JobEventModel({
      jobname: testJobName,
      action: jobEventStatuts.executed,
    }).save();

    const isEnded = await isJobInAction(testJobName, jobEventStatuts.ended);
    assert.equal(isEnded, false);
  });
});
