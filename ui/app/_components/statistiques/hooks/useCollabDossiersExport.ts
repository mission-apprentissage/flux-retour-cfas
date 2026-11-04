import { ML_SITUATION_DOSSIER_LABEL } from "shared/constants/missionLocale";
import type { ICollaborationDossier } from "shared/models/data/nationalStats.model";

import { collaborationDossiersExportColumns } from "@/common/exports";
import { _get } from "@/common/httpClient";

import { MOTIFS_CONFIG } from "../charts/motifsConfig";
import { DOSSIERS_TRAITES_V2_LABELS } from "../constants";

import { INDICATEURS_ML_BASE } from "./statsRoutes";
import { COLLAB_DOSSIER_STATUT_LABELS, type CollaborationDossiersParams } from "./useStatsQueries";
import { useStatsXlsxExport } from "./useStatsXlsxExport";

export const motifLabel = (motif: string) =>
  MOTIFS_CONFIG.find((config) => config.key === motif.toLowerCase())?.label ?? motif;

export function useCollabDossiersExport(params: CollaborationDossiersParams) {
  return useStatsXlsxExport("Collaborations-CFA-ML", collaborationDossiersExportColumns, async () => {
    const { data } = await _get<{ data: ICollaborationDossier[] }>(
      `${INDICATEURS_ML_BASE}/stats/collaborations/dossiers/export`,
      { params }
    );
    return data.map((dossier) => ({
      prenom: dossier.jeune.prenom ?? "",
      nom: dossier.jeune.nom ?? "",
      mission_locale: dossier.mission_locale.nom ?? "",
      mission_locale_commune: dossier.mission_locale.commune ?? "",
      cfa: dossier.cfa.nom ?? "",
      cfa_commune: dossier.cfa.commune ?? "",
      statut: COLLAB_DOSSIER_STATUT_LABELS[dossier.statut],
      situation: dossier.situation
        ? (ML_SITUATION_DOSSIER_LABEL[dossier.situation as keyof typeof ML_SITUATION_DOSSIER_LABEL] ??
          dossier.situation)
        : "",
      objectifs: dossier.motifs.map(motifLabel).join(", "),
      resultat: dossier.resultat ? DOSSIERS_TRAITES_V2_LABELS[dossier.resultat] : "",
      date_envoi: dossier.date_envoi,
      delai_jours: dossier.delai_jours,
      traite_par_ml: dossier.traite_par_ml ? "Oui" : "Non",
    }));
  });
}
