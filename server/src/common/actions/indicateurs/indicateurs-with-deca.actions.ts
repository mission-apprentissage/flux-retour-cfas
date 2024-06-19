import { ObjectId } from "mongodb";
import { TypeEffectifNominatif } from "shared/constants/indicateurs";
import { Acl } from "shared/constants/permissions";
import { IOrganisation } from "shared/models";

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

export const buildDECAFilter = (decaMode) => (decaMode ? { is_deca_compatible: true } : {});

export const getIndicateursEffectifsParDepartement = async (
  filters: DateFilters & TerritoireFilters,
  acl: Acl,
  organisation?: IOrganisation
) => {
  const indicateurs = [
    ...(await getIndicateursEffectifsParDepartementGenerique(filters, acl, effectifsDb(), false, organisation)),
    ...(await getIndicateursEffectifsParDepartementGenerique(filters, acl, effectifsDECADb(), true, organisation)),
  ];

  const mapDepartement = indicateurs.reduce((acc, { departement, ...rest }) => {
    return acc[departement]
      ? {
          ...acc,
          [departement]: {
            departement,
            apprentis: acc[departement].apprentis + rest.apprentis,
            abandons: acc[departement].abandons + rest.abandons,
            inscrits: acc[departement].inscrits + rest.inscrits,
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

export const getEffectifsNominatifsWithoutId = async (
  ctx: AuthContext,
  filters: FullEffectifsFilters,
  type: TypeEffectifNominatif,
  organismeId?: ObjectId
): Promise<{ effectifsWithoutIds: any[]; ids: ObjectId[] }> => {
  const effectifs = await getEffectifsNominatifs(ctx, filters, type, organismeId);
  return effectifs.reduce<{ effectifsWithoutIds: any[]; ids: ObjectId[] }>(
    (acc, { _id, ...rest }) => ({
      effectifsWithoutIds: [...acc.effectifsWithoutIds, rest],
      ids: [...acc.ids, _id],
    }),
    {
      effectifsWithoutIds: [],
      ids: [],
    }
  );
};

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
    inscrits: eff.inscrits + effDECA.inscrits,
    abandons: eff.abandons + effDECA.abandons,
    rupturants: eff.rupturants + effDECA.rupturants,
  };
};

export const getOrganismeIndicateursEffectifsParFormation = async (
  ctx: AuthContext,
  organismeId: ObjectId,
  filters: FullEffectifsFilters
) => {
  const indicateurs = [
    ...(await getOrganismeIndicateursEffectifsParFormationGenerique(ctx, organismeId, filters, effectifsDb())),
    ...(await getOrganismeIndicateursEffectifsParFormationGenerique(
      ctx,
      organismeId,
      filters,
      effectifsDECADb(),
      true
    )),
  ];

  const mapRNCP = indicateurs.reduce((acc, { rncp_code, ...rest }) => {
    const rncp = rncp_code ?? "null";
    return acc[rncp]
      ? {
          ...acc,
          [rncp]: {
            rncp_code,
            apprentis: acc[rncp].apprentis + rest.apprentis,
            abandons: acc[rncp].abandons + rest.abandons,
            inscrits: acc[rncp].inscrits + rest.inscrits,
            apprenants: acc[rncp].apprenants + rest.apprenants,
            rupturants: acc[rncp].rupturants + rest.rupturants,
          },
        }
      : {
          ...acc,
          [rncp]: {
            rncp_code,
            ...rest,
          },
        };
  }, {});

  return Object.values(mapRNCP);
};
