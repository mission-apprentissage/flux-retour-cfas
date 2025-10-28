import {
  dedupeInscritSansContrat,
  hydrateInscritSansContrat,
} from "@/jobs/hydrate/france-travail/hydrate-france-travail";

export const up = async () => {
  await hydrateInscritSansContrat();
  await dedupeInscritSansContrat();
};
