import { ObjectId } from "mongodb";

import { effectifsDECADb, effectifsDb } from "@/common/model/collections";
import { AuthContext } from "@/common/model/internal/AuthContext";
import { anneeScolaireDedupExpr, dateMetierExpr, dedupNomExpr } from "@/common/utils/mongoUtils";

import { combineFilters, EffectifsFiltersTerritoire } from "../helpers/filters";

import { buildEffectifMongoFilters } from "./effectifs/effectifs-filters";
import { getOrganismeIndicateursEffectifsGenerique, getOrganismeRestriction } from "./indicateurs.actions";

export const buildDECAFilter = (decaMode: boolean) => (decaMode ? { is_deca_compatible: true } : {});

const cleApprenantExpr = {
  $concat: [
    dedupNomExpr("$apprenant.nom"),
    "|",
    dedupNomExpr("$apprenant.prenom"),
    "|",
    { $ifNull: [{ $dateToString: { date: dateMetierExpr("$apprenant.date_de_naissance"), format: "%Y-%m-%d" } }, ""] },
    "|",
    anneeScolaireDedupExpr,
  ],
};

async function getClesApprenantsEffectifs(
  ctx: AuthContext,
  organismeId: ObjectId,
  filters: EffectifsFiltersTerritoire
): Promise<string[]> {
  const restriction = await getOrganismeRestriction(organismeId);
  const filtres = buildEffectifMongoFilters(filters, ctx.acl.indicateursEffectifs);
  const [contratDecaCompatible] = await effectifsDECADb()
    .aggregate([
      { $match: combineFilters(restriction, buildDECAFilter(true), ...filtres) },
      { $limit: 1 },
      { $project: { _id: 1 } },
    ])
    .toArray();
  if (!contratDecaCompatible) {
    return [];
  }
  const cles = await effectifsDb()
    .aggregate<{ _id: string }>([
      { $match: combineFilters(restriction, ...filtres) },
      { $group: { _id: cleApprenantExpr } },
    ])
    .toArray();
  return cles.map(({ _id }) => _id);
}

export const getOrganismeIndicateursEffectifs = async (
  ctx: AuthContext,
  organismeId: ObjectId,
  filters: EffectifsFiltersTerritoire
) => {
  const eff = await getOrganismeIndicateursEffectifsGenerique(ctx, organismeId, filters, effectifsDb(), false);
  const clesEffectifs = await getClesApprenantsEffectifs(ctx, organismeId, filters);
  const effDECA = await getOrganismeIndicateursEffectifsGenerique(
    ctx,
    organismeId,
    filters,
    effectifsDECADb(),
    true,
    clesEffectifs.length > 0 ? [{ $match: { $expr: { $not: { $in: [cleApprenantExpr, clesEffectifs] } } } }] : []
  );

  return {
    apprenants: eff.apprenants + effDECA.apprenants,
    apprentis: eff.apprentis + effDECA.apprentis,
    inscrits: eff.inscrits + effDECA.inscrits,
    abandons: eff.abandons + effDECA.abandons,
    rupturants: eff.rupturants + effDECA.rupturants,
  };
};
