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

function getTauxCouverture(transmetteurs: number, total: number): number {
  if (total === 0) return 100;
  return (transmetteurs / total) * 100;
}

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
          acc.totalOrganismes.inconnues += indicateursDepartement.totalOrganismes.inconnues;

          acc.organismesTransmetteurs.total += indicateursDepartement.organismesTransmetteurs.total;
          acc.organismesTransmetteurs.responsables += indicateursDepartement.organismesTransmetteurs.responsables;
          acc.organismesTransmetteurs.responsablesFormateurs +=
            indicateursDepartement.organismesTransmetteurs.responsablesFormateurs;
          acc.organismesTransmetteurs.formateurs += indicateursDepartement.organismesTransmetteurs.formateurs;
          acc.organismesTransmetteurs.inconnues += indicateursDepartement.organismesTransmetteurs.inconnues;

          acc.organismesNonTransmetteurs.total += indicateursDepartement.organismesNonTransmetteurs.total;
          acc.organismesNonTransmetteurs.responsables += indicateursDepartement.organismesNonTransmetteurs.responsables;
          acc.organismesNonTransmetteurs.responsablesFormateurs +=
            indicateursDepartement.organismesNonTransmetteurs.responsablesFormateurs;
          acc.organismesNonTransmetteurs.formateurs += indicateursDepartement.organismesNonTransmetteurs.formateurs;
          acc.organismesNonTransmetteurs.inconnues += indicateursDepartement.organismesNonTransmetteurs.inconnues;

          return acc;
        },
        {
          tauxCouverture: {
            total: 0,
            responsables: 0,
            responsablesFormateurs: 0,
            formateurs: 0,
            inconnues: 0,
          },
          totalOrganismes: {
            total: 0,
            responsables: 0,
            responsablesFormateurs: 0,
            formateurs: 0,
            inconnues: 0,
          },
          organismesTransmetteurs: {
            total: 0,
            responsables: 0,
            responsablesFormateurs: 0,
            formateurs: 0,
            inconnues: 0,
          },
          organismesNonTransmetteurs: {
            total: 0,
            responsables: 0,
            responsablesFormateurs: 0,
            formateurs: 0,
            inconnues: 0,
          },
        }
      ),
    };

    data.total.tauxCouverture.total = getTauxCouverture(
      data.total.organismesTransmetteurs.total,
      data.total.totalOrganismes.total
    );
    data.total.tauxCouverture.responsables = getTauxCouverture(
      data.total.organismesTransmetteurs.responsables,
      data.total.totalOrganismes.responsables
    );
    data.total.tauxCouverture.responsablesFormateurs = getTauxCouverture(
      data.total.organismesTransmetteurs.responsablesFormateurs,
      data.total.totalOrganismes.responsablesFormateurs
    );
    data.total.tauxCouverture.formateurs = getTauxCouverture(
      data.total.organismesTransmetteurs.formateurs,
      data.total.totalOrganismes.formateurs
    );
    data.total.tauxCouverture.inconnues = getTauxCouverture(
      data.total.organismesTransmetteurs.inconnues,
      data.total.totalOrganismes.inconnues
    );

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
