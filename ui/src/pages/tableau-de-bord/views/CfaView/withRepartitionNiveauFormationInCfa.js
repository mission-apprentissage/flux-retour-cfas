import React from "react";
import { useQuery } from "react-query";

import { fetchEffectifsParNiveauFormation } from "../../../../common/api/tableauDeBord";
import { mapFiltersToApiFormat } from "../../../../common/utils/mapFiltersToApiFormat";
import { pick } from "../../../../common/utils/pick";
import { filtersPropTypes } from "../../FiltersContext";

const withRepartitionNiveauFormationInCfa = (Component) => {
  const WithRepartitionNiveauFormationInCfa = ({ filters, ...props }) => {
    const requestFilters = {
      ...pick(mapFiltersToApiFormat(filters), ["date", "uai_etablissement", "siret_etablissement"]),
    };
    const { data, isLoading, error } = useQuery(["effectifs-par-niveau-formation", requestFilters], () =>
      fetchEffectifsParNiveauFormation(requestFilters)
    );

    const repartitionEffectifs = data?.map(({ niveau_formation, niveau_formation_libelle, effectifs }) => {
      return { niveauFormation: niveau_formation, niveauFormationLibelle: niveau_formation_libelle, effectifs };
    });

    return <Component {...props} repartitionEffectifs={repartitionEffectifs} loading={isLoading} error={error} />;
  };

  WithRepartitionNiveauFormationInCfa.propTypes = {
    filters: filtersPropTypes.state,
  };

  return WithRepartitionNiveauFormationInCfa;
};

export default withRepartitionNiveauFormationInCfa;
