import { hydrateInscritSansContrat } from "@/jobs/hydrate/france-travail/hydrate-france-travail";

export const up = async () => {
  return hydrateInscritSansContrat();
};
