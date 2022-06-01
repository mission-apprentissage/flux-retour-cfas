const assert = require("assert").strict;
const jobEvents = require("../../../../src/common/components/jobEvents");
const { JobEventModel } = require("../../../../src/common/model");
const { jobEventStatuts } = require("../../../../src/common/constants/jobsConstants");
const { wait } = require("../../../utils/testUtils");

describe(__filename, () => {
  it("Permet de vérifier si le job courant est dans l'action terminée", async () => {
    const { isJobInAction } = await jobEvents();

    const testJobName = "TEST-JOB";
    // Add started event
    await new JobEventModel({
      jobname: testJobName,
      action: jobEventStatuts.started,
      date: new Date(),
    }).save();

    // leave a tiny amount of time, otherwise the jobEvent date field will have the millisecond and test will result in a false-negative
    await wait(1);

    // Add executed event
    await new JobEventModel({
      jobname: testJobName,
      action: jobEventStatuts.executed,
      date: new Date(),
    }).save();

    await wait(1);

    // Add ended event
    await new JobEventModel({
      jobname: testJobName,
      action: jobEventStatuts.ended,
      date: new Date(),
    }).save();

    const isEnded = await isJobInAction(testJobName, jobEventStatuts.ended);
    assert.equal(isEnded, false);
  });

  it("Permet de vérifier si le job courant n'est pas dans l'action terminée", async () => {
    const { isJobInAction } = await jobEvents();

    const testJobName = "TEST-JOB";
    // Add started event
    await new JobEventModel({
      jobname: testJobName,
      action: jobEventStatuts.started,
      date: new Date(),
    }).save();

    // Add executed event
    await new JobEventModel({
      jobname: testJobName,
      action: jobEventStatuts.executed,
      date: new Date(),
    }).save();

    const isEnded = await isJobInAction(testJobName, jobEventStatuts.ended);
    assert.equal(isEnded, false);
  });
});
