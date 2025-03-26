import Boom from "boom";
import type { IEffectifV2 } from "shared/models";

import { createComputedStatutObject } from "@/common/actions/effectifs.statut.actions";

// For now use the old effectif status builder to avoid breaking changes
export function buildEffectifStatus(effectif: Pick<IEffectifV2, "session" | "contrats">, now: Date) {
  const params = {
    formation: {
      date_entree: effectif.session.debut,
      date_fin: effectif.session.fin,
    },
    apprenant: { historique_statut: [] },
    contrats: Object.values(effectif.contrats).map((c) => ({
      date_debut: c.date_debut,
      date_rupture: c.rupture?.date_rupture ?? null,
      cause_rupture: c.rupture?.cause ?? null,
      date_fin: c.date_fin ?? null,
      siret_employeur: c.employeur.siret ?? null,
    })),
  };

  const result = createComputedStatutObject(params, now);

  if (!result) {
    throw Boom.internal("buildEffectifStatus: unexpected error");
  }

  return result;
}
