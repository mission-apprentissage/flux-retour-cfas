import { addJob } from "job-processor";
import effectifsDECAModelDescriptor from "shared/models/data/effectifsDECA.model";

export const up = async () => {
  await addJob({
    name: "indexes:collection:create",
    payload: {
      collection: effectifsDECAModelDescriptor,
    },
    queued: true,
  });
};
