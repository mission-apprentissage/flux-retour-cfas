import type { IMissionLocaleEffectif } from "shared/models/data/missionLocaleEffectif.model";

import { missionLocaleEffectifsLogDb } from "@/common/model/collections";

export async function estDossierMlTraite(dossier: IMissionLocaleEffectif): Promise<boolean> {
  if (
    dossier.situation ||
    dossier.whatsapp_contact ||
    dossier.cfa_rupture_declaration ||
    dossier.organisme_data?.acc_conjoint === true ||
    dossier.organisme_data?.reponse_at ||
    dossier.souhaite_rdv === true ||
    dossier.effectif_choice?.confirmation != null
  ) {
    return true;
  }
  const log = await missionLocaleEffectifsLogDb().findOne(
    { mission_locale_effectif_id: dossier._id },
    { projection: { _id: 1 } }
  );
  return log !== null;
}
