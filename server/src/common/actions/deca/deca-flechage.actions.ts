import type { ObjectId } from "mongodb";
import type { IEffectifDECA } from "shared/models/data/effectifsDECA.model";
import type { IOrganisme } from "shared/models/data/organismes.model";

import { generateOrganismeComputed } from "@/common/actions/organismes/organismes.actions";
import { effectifsDECADb } from "@/common/model/collections";

export const FILTRE_CHEZ_CIBLE = { fleche: { $exists: true }, "fleche.annule_le": { $exists: false } } as const;

export function appliquerCible<
  T extends Pick<IEffectifDECA, "organisme_id" | "organisme_formateur_id" | "is_deca_compatible" | "_computed">,
>(document: T, organisme: IOrganisme): T {
  return {
    ...document,
    organisme_id: organisme._id,
    organisme_formateur_id: organisme._id,
    is_deca_compatible: !organisme.is_transmission_target,
    _computed: { ...document._computed, organisme: generateOrganismeComputed(organisme) },
  };
}

export async function chargerResponsablesFleches(): Promise<Set<string>> {
  const responsables = await effectifsDECADb().distinct("organisme_responsable_id", FILTRE_CHEZ_CIBLE);
  return new Set(responsables.filter((id): id is ObjectId => !!id).map((id) => id.toString()));
}
