import { ObjectId } from "mongodb";
import { TypeEffectifNominatif } from "shared/constants/indicateurs";
import { Acl } from "shared/constants/permissions";

import { effectifsDECADb, effectifsDb } from "@/common/model/collections";
import { AuthContext } from "@/common/model/internal/AuthContext";

import { DateFilters, EffectifsFiltersTerritoire, FullEffectifsFilters, TerritoireFilters } from "../helpers/filters";

import {
  getIndicateursEffectifsParDepartementGenerique,
  getIndicateursEffectifsParOrganismeGenerique,
  getEffectifsNominatifsGenerique,
  getOrganismeIndicateursEffectifsParFormationGenerique,
  getOrganismeIndicateursEffectifsGenerique,
} from "./indicateurs.actions";

export const buildDECAFilter = (decaMode) => (decaMode ? { isDecaCompatible: true } : {});

// Attention ca marche pas, il faut ensuite merger par departement et sommer les valeurs
export const getIndicateursEffectifsParDepartement = async (filters: DateFilters & TerritoireFilters, acl: Acl) => {
  const indicateurs = [
    ...(await getIndicateursEffectifsParDepartementGenerique(filters, acl, effectifsDb(), false)),
    ...(await getIndicateursEffectifsParDepartementGenerique(filters, acl, effectifsDECADb(), true)),
  ];

  const mapDepartement = indicateurs.reduce((acc, { departement, ...rest }) => {
    return acc[departement]
      ? {
          ...acc,
          [departement]: {
            departement,
            apprentis: acc[departement].apprentis + rest.apprentis,
            abandons: acc[departement].abandons + rest.abandons,
            inscritsSansContrat: acc[departement].inscritsSansContrat + rest.inscritsSansContrat,
            apprenants: acc[departement].apprenants + rest.apprenants,
            rupturants: acc[departement].rupturants + rest.rupturants,
          },
        }
      : {
          ...acc,
          [departement]: {
            departement,
            ...rest,
          },
        };
  }, {});
  return Object.values(mapDepartement);
};

export const getIndicateursEffectifsParOrganisme = async (
  ctx: AuthContext,
  filters: FullEffectifsFilters,
  organismeId?: ObjectId
) => [
  ...(await getIndicateursEffectifsParOrganismeGenerique(ctx, filters, effectifsDb(), false, organismeId)),
  ...(await getIndicateursEffectifsParOrganismeGenerique(ctx, filters, effectifsDECADb(), true, organismeId)),
];

export const getEffectifsNominatifs = async (
  ctx: AuthContext,
  filters: FullEffectifsFilters,
  type: TypeEffectifNominatif,
  organismeId?: ObjectId
) => [
  ...(await getEffectifsNominatifsGenerique(ctx, filters, type, effectifsDb(), false, organismeId)),
  ...(await getEffectifsNominatifsGenerique(ctx, filters, type, effectifsDECADb(), true, organismeId)),
];

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
    inscritsSansContrat: eff.inscritsSansContrat + effDECA.inscritsSansContrat,
    abandons: eff.abandons + effDECA.abandons,
    rupturants: eff.rupturants + effDECA.rupturants,
  };
};

export const getOrganismeIndicateursEffectifsParFormation = async (
  ctx: AuthContext,
  organismeId: ObjectId,
  filters: FullEffectifsFilters
) => [
  ...(await getOrganismeIndicateursEffectifsParFormationGenerique(ctx, organismeId, filters, effectifsDb())),
  ...(await getOrganismeIndicateursEffectifsParFormationGenerique(ctx, organismeId, filters, effectifsDECADb(), true)),
];