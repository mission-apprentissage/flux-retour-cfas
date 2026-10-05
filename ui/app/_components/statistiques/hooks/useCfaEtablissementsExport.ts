import { DEPARTEMENTS_BY_CODE } from "shared/constants/territoires";
import type { ICfaEtablissement } from "shared/models/data/nationalStats.model";

import { cfaEtablissementsExportColumns } from "@/common/exports";
import { _get } from "@/common/httpClient";

import { NATURE_LABELS } from "../constants";

import { INDICATEURS_ML_BASE } from "./statsRoutes";
import { buildCfaEtablissementsRequestParams, type CfaEtablissementsParams } from "./useStatsQueries";
import { useStatsXlsxExport } from "./useStatsXlsxExport";

const ouiNon = (value: boolean | null) => (value === null ? "" : value ? "Oui" : "Non");

export function useCfaEtablissementsExport(params: CfaEtablissementsParams) {
  return useStatsXlsxExport("Etablissements-de-formation", cfaEtablissementsExportColumns, async () => {
    const { data } = await _get<{ data: ICfaEtablissement[] }>(
      `${INDICATEURS_ML_BASE}/stats/cfa/etablissements/export`,
      { params: buildCfaEtablissementsRequestParams(params) }
    );
    return data.map((row) => {
      const departement = row.departement
        ? DEPARTEMENTS_BY_CODE[row.departement as keyof typeof DEPARTEMENTS_BY_CODE]
        : undefined;
      return {
        region: departement?.region.nom ?? "",
        departement: departement?.nom ?? row.departement ?? "",
        nom: row.nom ?? "",
        uai: row.uai ?? "",
        siret: row.siret,
        nature: NATURE_LABELS[row.nature ?? "inconnue"] ?? row.nature,
        qualiopi: ouiNon(row.qualiopi),
        code_postal: row.adresse?.code_postal ?? "",
        commune: row.adresse?.commune ?? "",
        adresse: row.adresse?.complete ?? "",
        compte_tba: ouiNon(row.has_account),
        collab_active: ouiNon(row.collab_active),
        nb_collaborations: row.nb_collaborations,
        derniere_activite: row.derniere_activite ?? "",
      };
    });
  });
}
