import { ObjectId } from "mongodb";

import { effectifsDECADb, effectifsDb } from "@/common/model/collections";
import { AuthContext } from "@/common/model/internal/AuthContext";

import { EffectifsFiltersTerritoire } from "../helpers/filters";

import { getOrganismeIndicateursEffectifsGenerique } from "./indicateurs.actions";

export const buildDECAFilter = (decaMode) => (decaMode ? { is_deca_compatible: true } : {});

export const getOrganismeIndicateursEffectifs = async (
  ctx: AuthContext,
  organismeId: ObjectId,
  filters: EffectifsFiltersTerritoire
) => {
  const eff = await getOrganismeIndicateursEffectifsGenerique(ctx, organismeId, filters, effectifsDb(), false);
  const effDECA = await getOrganismeIndicateursEffectifsGenerique(ctx, organismeId, filters, effectifsDECADb(), true);

  return {
    apprenants: eff.apprenants + effDECA.apprenants,
    apprentis: eff.apprentis + effDECA.apprentis,
    inscrits: eff.inscrits + effDECA.inscrits,
    abandons: eff.abandons + effDECA.abandons,
    rupturants: eff.rupturants + effDECA.rupturants,
  };
};
