// import { strict as assert } from "assert";
// import { jobEventStatuts } from "../../../../src/common/constants/jobsConstants.js";
// import { addMinutes } from "date-fns";
// import { jobEventsDb } from "../../../../src/common/model/collections.js";
// import { isJobInAction } from "../../../../src/common/actions/jobEvents.actions.js";

// describe("Components JobEvents Test", () => {
//   it("Permet de vérifier si le job courant est dans l'action terminée", async () => {
//     const testJobName = "TEST-JOB";
//     // Add started event
//     await jobEventsDb().insertOne({
//       jobname: testJobName,
//       action: jobEventStatuts.started,
//       date: new Date(),
//     });

//     // Add executed event
//     await jobEventsDb().insertOne({
//       jobname: testJobName,
//       action: jobEventStatuts.executed,
//       date: addMinutes(new Date(), 5),
//     });

//     // Add ended event
//     await jobEventsDb().insertOne({
//       jobname: testJobName,
//       action: jobEventStatuts.ended,
//       date: addMinutes(new Date(), 6),
//     });

//     const isEnded = await isJobInAction(testJobName, jobEventStatuts.ended);
//     assert.equal(isEnded, true);
//   });

//   it("Permet de vérifier si le job courant n'est pas dans l'action terminée", async () => {
//     const testJobName = "TEST-JOB";
//     // Add started event
//     await jobEventsDb().insertOne({
//       jobname: testJobName,
//       action: jobEventStatuts.started,
//       date: new Date(),
//     });

//     // Add executed event
//     await jobEventsDb().insertOne({
//       jobname: testJobName,
//       action: jobEventStatuts.executed,
//       date: addMinutes(new Date(), 5),
//     });

//     const isEnded = await isJobInAction(testJobName, jobEventStatuts.ended);
//     assert.equal(isEnded, false);
//   });
// });
