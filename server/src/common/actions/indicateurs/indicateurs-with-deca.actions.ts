import { ObjectId } from "mongodb";

import { effectifsDECADb, effectifsDb } from "@/common/model/collections";
import { AuthContext } from "@/common/model/internal/AuthContext";
import { dateMetierExpr, dedupNomExpr } from "@/common/utils/mongoUtils";

import { EffectifsFiltersTerritoire } from "../helpers/filters";

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
    { $ifNull: ["$annee_scolaire", ""] },
  ],
};

async function getClesApprenantsEffectifs(organismeId: ObjectId): Promise<string[]> {
  const cles = await effectifsDb()
    .aggregate<{ _id: string }>([
      { $match: await getOrganismeRestriction(organismeId) },
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
  const clesEffectifs = await getClesApprenantsEffectifs(organismeId);
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
