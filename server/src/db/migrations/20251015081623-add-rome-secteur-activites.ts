import { hydrateRomeSecteurActivites } from "@/jobs/hydrate/rome/hydrate-rome";

export const up = async () => {
  return hydrateRomeSecteurActivites();
};
