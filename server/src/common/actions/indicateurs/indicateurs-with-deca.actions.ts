import { ObjectId } from "mongodb";
import { TypeEffectifNominatif } from "shared/constants/indicateurs";
import { Acl } from "shared/constants/permissions";
import { type IndicateursEffectifsAvecFormation } from "shared/models";

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

export const getIndicateursEffectifsParDepartement = async (filters: DateFilters & TerritoireFilters, acl: Acl) => {
  const [indicateursEffectifs, indicateursEffectifsDeca] = await Promise.all([
    getIndicateursEffectifsParDepartementGenerique(filters, acl, effectifsDb(), false),
    getIndicateursEffectifsParDepartementGenerique(filters, acl, effectifsDECADb(), true),
  ]);

  const indicateurs = [...indicateursEffectifs, ...indicateursEffectifsDeca];
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

const getEffectifsNominatifs = async (
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
): Promise<IndicateursEffectifsAvecFormation[]> => {
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

  const mapRNCP = indicateurs.reduce<Record<string, IndicateursEffectifsAvecFormation>>(
    (acc, { rncp_code, cfd_code, ...rest }) => {
      const id = `${rncp_code ?? "null"}-${cfd_code ?? "null"}`;

      if (acc[id] == null) {
        acc[id] = {
          rncp_code,
          cfd_code,
          ...rest,
        };
      } else {
        acc[id] = {
          ...acc[id],
          apprentis: acc[id].apprentis + rest.apprentis,
          abandons: acc[id].abandons + rest.abandons,
          inscrits: acc[id].inscrits + rest.inscrits,
          apprenants: acc[id].apprenants + rest.apprenants,
          rupturants: acc[id].rupturants + rest.rupturants,
        };
      }

      return acc;
    },
    {}
  );

  return Object.values(mapRNCP);
};
