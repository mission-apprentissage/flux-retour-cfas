import { ObjectId } from "mongodb";

import type { IMissionLocaleEffectif } from "../data";
import { SITUATION_ENUM } from "../data/missionLocaleEffectif.model";

export function generateMissionLocaleEffectifFixture(overrides: {
  organisme_id: ObjectId;
  created_at: Date;
  mission_locale_id?: ObjectId;
  reponse_at?: Date | null;
  situation?: SITUATION_ENUM | null;
  soft_deleted?: boolean;
  snapshot_region?: string | null;
  computed_activated_at?: Date | null;
  source?: "ERP" | "DECA";
}): IMissionLocaleEffectif {
  const snapshot: Record<string, unknown> = { organisme_id: overrides.organisme_id };
  if (overrides.source) snapshot.source = overrides.source;
  if (overrides.snapshot_region !== undefined) {
    snapshot._computed = { organisme: { region: overrides.snapshot_region } };
  }

  return {
    _id: new ObjectId(),
    mission_locale_id: overrides.mission_locale_id ?? new ObjectId(),
    effectif_id: new ObjectId(),
    created_at: overrides.created_at,
    situation: overrides.situation ?? null,
    soft_deleted: overrides.soft_deleted ?? false,
    brevo: {},
    effectif_snapshot: snapshot as IMissionLocaleEffectif["effectif_snapshot"],
    ...(overrides.computed_activated_at !== undefined
      ? { computed: { organisme: { ml_beta_activated_at: overrides.computed_activated_at } } }
      : {}),
    organisme_data: overrides.reponse_at ? { reponse_at: overrides.reponse_at, has_unread_notification: false } : null,
    current_status: { value: null, date: null },
    whatsapp_callback_requested: false,
    whatsapp_no_help_responded: false,
    souhaite_rdv: false,
  };
}
