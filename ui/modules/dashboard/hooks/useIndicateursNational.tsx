import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import {
  IndicateursOrganismes,
  IndicateursOrganismesAvecDepartement,
  IndicateursEffectifs,
  IndicateursEffectifsAvecDepartement,
} from "shared";

import { _get } from "@/common/httpClient";
import { TerritoireFilters, convertEffectifsFiltersToQuery } from "@/modules/models/effectifs-filters";

type UseIndicateursEffectifsParDepartementLoading = {
  isReady: false;
  effectifs: null;
  organismes: null;
};

type UseIndicateursEffectifsParDepartementReady = {
  isReady: true;
  effectifs: {
    parDepartement: IndicateursEffectifsAvecDepartement[];
    total: IndicateursEffectifs;
  };
  organismes: {
    parDepartement: IndicateursOrganismesAvecDepartement[];
    total: IndicateursOrganismes;
  };
};

type UseIndicateursEffectifsParDepartement =
  | UseIndicateursEffectifsParDepartementLoading
  | UseIndicateursEffectifsParDepartementReady;

type ApiResult = {
  indicateursEffectifs: IndicateursEffectifsAvecDepartement[];
  indicateursOrganismes: IndicateursOrganismesAvecDepartement[];
};

export function useIndicateurNational(
  effectifsFilters: Partial<TerritoireFilters>,
  enabled: boolean
): UseIndicateursEffectifsParDepartement {
  const { isSuccess, data } = useQuery<ApiResult>(
    ["indicateurs/national", effectifsFilters],
    () =>
      _get("/api/v1/indicateurs/national", {
        params: convertEffectifsFiltersToQuery(effectifsFilters),
      }),
    { enabled }
  );

  const effectifParDepartement = isSuccess ? data.indicateursEffectifs : null;
  const organismeParDepartement = isSuccess ? data.indicateursOrganismes : null;

  const effectifs = useMemo(() => {
    if (!effectifParDepartement) return null;

    return {
      parDepartement: effectifParDepartement,
      total: effectifParDepartement.reduce(
        (acc, indicateursDepartement) => {
          acc.apprenants += indicateursDepartement.apprenants;
          acc.apprentis += indicateursDepartement.apprentis;
          acc.inscritsSansContrat += indicateursDepartement.inscritsSansContrat;
          acc.abandons += indicateursDepartement.abandons;
          acc.rupturants += indicateursDepartement.rupturants;
          return acc;
        },
        {
          apprenants: 0,
          apprentis: 0,
          inscritsSansContrat: 0,
          abandons: 0,
          rupturants: 0,
        }
      ),
    };
  }, [isSuccess, effectifParDepartement]);

  const organismes = useMemo(() => {
    if (!organismeParDepartement) return null;

    const data = {
      parDepartement: organismeParDepartement,
      total: organismeParDepartement.reduce(
        (acc, indicateursDepartement) => {
          acc.totalOrganismes.total += indicateursDepartement.totalOrganismes.total;
          acc.totalOrganismes.responsables += indicateursDepartement.totalOrganismes.responsables;
          acc.totalOrganismes.responsablesFormateurs += indicateursDepartement.totalOrganismes.responsablesFormateurs;
          acc.totalOrganismes.formateurs += indicateursDepartement.totalOrganismes.formateurs;
          acc.totalOrganismes.inconnue += indicateursDepartement.totalOrganismes.inconnue;

          acc.organismesTransmetteurs.total += indicateursDepartement.organismesTransmetteurs.total;
          acc.organismesTransmetteurs.responsables += indicateursDepartement.organismesTransmetteurs.responsables;
          acc.organismesTransmetteurs.responsablesFormateurs +=
            indicateursDepartement.organismesTransmetteurs.responsablesFormateurs;
          acc.organismesTransmetteurs.formateurs += indicateursDepartement.organismesTransmetteurs.formateurs;
          acc.organismesTransmetteurs.inconnue += indicateursDepartement.organismesTransmetteurs.inconnue;

          acc.organismesNonTransmetteurs.total += indicateursDepartement.organismesNonTransmetteurs.total;
          acc.organismesNonTransmetteurs.responsables += indicateursDepartement.organismesNonTransmetteurs.responsables;
          acc.organismesNonTransmetteurs.responsablesFormateurs +=
            indicateursDepartement.organismesNonTransmetteurs.responsablesFormateurs;
          acc.organismesNonTransmetteurs.formateurs += indicateursDepartement.organismesNonTransmetteurs.formateurs;
          acc.organismesNonTransmetteurs.inconnue += indicateursDepartement.organismesNonTransmetteurs.inconnue;

          return acc;
        },
        {
          tauxCouverture: {
            total: 0,
            responsables: 0,
            responsablesFormateurs: 0,
            formateurs: 0,
            inconnue: 0,
          },
          totalOrganismes: {
            total: 0,
            responsables: 0,
            responsablesFormateurs: 0,
            formateurs: 0,
            inconnue: 0,
          },
          organismesTransmetteurs: {
            total: 0,
            responsables: 0,
            responsablesFormateurs: 0,
            formateurs: 0,
            inconnue: 0,
          },
          organismesNonTransmetteurs: {
            total: 0,
            responsables: 0,
            responsablesFormateurs: 0,
            formateurs: 0,
            inconnue: 0,
          },
        }
      ),
    };

    data.total.tauxCouverture.total =
      (data.total.organismesTransmetteurs.total / data.total.totalOrganismes.total) * 100;
    data.total.tauxCouverture.responsables =
      (data.total.organismesTransmetteurs.responsables / data.total.totalOrganismes.responsables) * 100;
    data.total.tauxCouverture.responsablesFormateurs =
      (data.total.organismesTransmetteurs.responsablesFormateurs / data.total.totalOrganismes.responsablesFormateurs) *
      100;
    data.total.tauxCouverture.formateurs =
      (data.total.organismesTransmetteurs.formateurs / data.total.totalOrganismes.formateurs) * 100;
    data.total.tauxCouverture.inconnue =
      (data.total.organismesTransmetteurs.inconnue / data.total.totalOrganismes.inconnue) * 100;

    return data;
  }, [isSuccess, effectifParDepartement]);

  if (isSuccess && effectifs !== null && organismes !== null) {
    return {
      isReady: isSuccess,
      effectifs,
      organismes,
    };
  }

  return {
    isReady: false,
    effectifs: null,
    organismes: null,
  };
}
