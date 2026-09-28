import { addJob } from "job-processor";

export const up = async () => {
  await addJob({
    name: "tmp:migrate:communes-voies-puis-commune-apprenant",
    queued: true,
  });
};
