import type { ICfaInviteSansCollabRow } from "shared/models/routes/admin/cfa-invites-sans-collab.api";

import { cfaInvitesSansCollabExportColumns } from "@/common/exports";
import { _get } from "@/common/httpClient";

import { INDICATEURS_ML_BASE } from "./statsRoutes";
import { avecVueFrance, type CfaInvitesParams } from "./useStatsQueries";
import { useStatsXlsxExport } from "./useStatsXlsxExport";

export function useCfaInvitesExport(params: CfaInvitesParams) {
  return useStatsXlsxExport("CFA-invites", cfaInvitesSansCollabExportColumns, async () => {
    const { data } = await _get<{ data: ICfaInviteSansCollabRow[] }>(
      `${INDICATEURS_ML_BASE}/stats/cfa/invites-sans-collab/export`,
      { params: avecVueFrance(params) }
    );
    return data.map((row) => ({
      raison_sociale: row.raison_sociale ?? "",
      uai: row.uai ?? "",
      siret: row.siret,
      compte_tba: row.has_account ? "Oui" : "Non",
      nb_collaborations: row.nb_collaborations,
      date_activation: row.date_activation,
      date_premiere_collaboration: row.date_premiere_collaboration,
      code_postal: row.adresse?.code_postal ?? "",
      commune: row.adresse?.commune ?? "",
      adresse: row.adresse?.complete ?? "",
      invitations_recues: row.invitations_recues,
      ml_invitantes: row.ml_invitantes,
      derniere_invitation_at: row.derniere_invitation_at,
    }));
  });
}
