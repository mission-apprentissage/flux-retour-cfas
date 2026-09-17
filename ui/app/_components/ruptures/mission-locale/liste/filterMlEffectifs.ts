import { matchesPostalCodes } from "@/app/_utils/ruptures.utils";
import type { MlListeEffectif } from "@/common/types/ruptures";

import { matchesSearchTerm } from "../../shared/utils/searchUtils";

import type { MlCritere } from "./MlCriteresFilter";

export type MlFiltres = {
  recherche: string;
  codesPostaux: string[];
  criteres: MlCritere[];
};

/** Filtre sans retrier : l'ordre de priorité vient du serveur. Critères cumulatifs en OU. */
export function filterMlEffectifs(effectifs: MlListeEffectif[], { recherche, codesPostaux, criteres }: MlFiltres) {
  return effectifs.filter((effectif) => {
    if (recherche && !matchesSearchTerm(effectif.nom, effectif.prenom, recherche)) return false;
    if (!matchesPostalCodes(effectif, codesPostaux)) return false;
    if (criteres.length > 0 && !criteres.some((critere) => Boolean(effectif[critere]))) return false;
    return true;
  });
}
