import { addJob } from "job-processor";

export const up = async () => {
  addJob({
    name: "tmp:migrate:mission-locale-effectif-snapshot",
    queued: true,
    payload: { date: new Date("2025-09-11T00:00:00.000Z") },
  });
};
