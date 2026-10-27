import type { JobDef } from "job-processor";
import { ObjectId } from "mongodb";

import { traiterEnvoisDemandesActivation } from "@/common/actions/admin/demandes-activation.actions";

import { payloadString } from "./payload";

export const demandesActivationJobs = {
  "demandes-activation:envoyer": {
    handler: async (job) => {
      const organismeId = payloadString(job.payload, "organismeId");
      await traiterEnvoisDemandesActivation(organismeId ? new ObjectId(organismeId) : null);
    },
  },
} satisfies Record<string, JobDef>;
