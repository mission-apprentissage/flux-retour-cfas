import { addJob } from "job-processor";

import { organismesDb } from "@/common/model/collections";

export const up = async () => {
  await organismesDb().updateMany(
    {
      relatedFormations: { $exists: true },
    },
    { $unset: { relatedFormations: true } },
    { bypassDocumentValidation: true }
  );
  await organismesDb().updateMany(
    {
      formations_count: { $exists: false },
    },
    { $set: { formations_count: 0 } },
    { bypassDocumentValidation: true }
  );

  await addJob({
    name: "hydrate:organismes-formations-count",
    queued: true,
  });
};
