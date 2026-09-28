import type { CronDef, JobDef } from "job-processor";

import { hydrateCommunesVoies } from "../hydrate/communes-voies/hydrate-communes-voies";
import { hydrateOpenApi } from "../hydrate/open-api/hydrate-open-api";
import { populateReseauxCollection } from "../hydrate/reseaux/hydrate-reseaux";
import { hydrateRomeSecteurActivites } from "../hydrate/rome/hydrate-rome";
import { deleteOrganisationWithoutUser, updateOrganismeIdInOrganisations } from "../organisations/organisation.job";
import { validationTerritoires } from "../territoire/validationTerritoire";

export const diversJobs = {
  "territoire:validate": {
    handler: validationTerritoires,
  },
  "hydrate:communes-voies": {
    handler: hydrateCommunesVoies,
  },
  "populate:reseaux": {
    handler: async () => {
      return populateReseauxCollection();
    },
  },
  "dev:generate-open-api": {
    handler: async () => {
      return hydrateOpenApi();
    },
  },
  "tmp:migration:organisation-organisme": {
    handler: async () => {
      return updateOrganismeIdInOrganisations();
    },
  },
  "tmp:migration:dedoublon-organisation": {
    handler: async () => {
      return deleteOrganisationWithoutUser();
    },
  },
  "tmp:hydrate:rome-secteur-activites": {
    handler: async () => {
      return hydrateRomeSecteurActivites();
    },
  },
} satisfies Record<string, JobDef>;

export const diversCrons = {
  // 04h05 Paris le 1er du mois — contrôle de cohérence des constantes de territoires
  "Validation des constantes de territoires": {
    cron_string: "5 4 1 * *",
    handler: validationTerritoires,
  },

  // 03h30 Paris le 2 du mois — référentiel voies BAN des codes postaux multi-communes
  "hydrate:communes-voies": {
    cron_string: "30 3 2 * *",
    handler: hydrateCommunesVoies,
  },

  // TODO : Checker si coté métier l'archivage est toujours prévu ?
  // "Run archive dossiers apprenants & effectifs job each first day of month at 12h45": {
  //   cron_string: "45 12 1 * *",
  //   handler: async () => {
  //     // run-archive-job.sh yarn cli archive:dossiersApprenantsEffectifs
  //     return 0;
  //   },
  // },
} satisfies Record<string, CronDef>;
