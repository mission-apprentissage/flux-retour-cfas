import { addJob, type CronDef, type JobDef } from "job-processor";
import { ObjectId } from "mongodb";

import {
  envoyerInvitezCollaborateurs,
  relancerDemandesActivation,
} from "@/common/actions/admin/demandes-activation-relances.actions";
import {
  calculerContratsFlechablesDesDemandes,
  traiterEnvoisDemandesActivation,
} from "@/common/actions/admin/demandes-activation.actions";

import { payloadString, requirePayloadString } from "./payload";

export const demandesActivationJobs = {
  "demandes-activation:envoyer": {
    handler: async (job) => {
      const organismeId = payloadString(job.payload, "organismeId");
      await traiterEnvoisDemandesActivation(organismeId ? new ObjectId(organismeId) : null);
    },
  },
  "demandes-activation:flechables": {
    handler: async () => {
      await calculerContratsFlechablesDesDemandes();
    },
  },
  "demandes-activation:inviter-collaborateurs": {
    handler: async (job) => {
      await envoyerInvitezCollaborateurs(new ObjectId(requirePayloadString(job.payload, "demandeId")));
    },
  },
  "demandes-activation:relances": {
    handler: async () => {
      await relancerDemandesActivation();
    },
  },
} satisfies Record<string, JobDef>;

export const demandesActivationCrons = {
  "Relances du workflow d'activation des CFA toutes les heures": {
    cron_string: "20 * * * *",
    checkinMargin: 480,
    maxRuntimeInMinutes: 15,
    handler: async () => {
      await addJob({ name: "demandes-activation:relances", queued: true });
      return 0;
    },
  },
} satisfies Record<string, CronDef>;
