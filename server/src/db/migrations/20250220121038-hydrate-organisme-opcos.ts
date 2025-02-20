import { addJob } from "job-processor";

import { organismesDb } from "@/common/model/collections";

export const up = async () => {
  await organismesDb().updateMany({}, { $set: { relatedFormations: [] } }, { bypassDocumentValidation: true });

  await addJob({
    name: "hydrate:organismes-formations",
    queued: true,
  });
  await addJob({
    name: "hydrate:opcos",
    queued: true,
  });
};
