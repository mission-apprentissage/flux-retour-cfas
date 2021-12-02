import React from "react";
import { useQuery } from "react-query";

import { fetchEffectifsParNiveauFormation } from "../../../../common/api/tableauDeBord";
import { mapFiltersToApiFormat } from "../../../../common/utils/mapFiltersToApiFormat";
import { pick } from "../../../../common/utils/pick";
import { filtersPropTypes } from "../../FiltersContext";

const withRepartitionEffectifsReseauParNiveauEtAnneeFormation = (Component) => {
  const WithRepartitionEffectifsReseauParNiveauEtAnneeFormation = ({ filters, ...props }) => {
    const requestFilters = pick(mapFiltersToApiFormat(filters), [
      "date",
      "etablissement_num_region",
      "etablissement_num_departement",
      "etablissement_reseaux",
    ]);
    const { data, isLoading, error } = useQuery(["effectifs-par-niveau-formation", requestFilters], () =>
      fetchEffectifsParNiveauFormation(requestFilters)
    );
    const repartitionEffectifs = data?.map((repartition) => {
      return {
        niveauFormation: repartition.niveau_formation,
        niveauFormationLibelle: repartition.niveau_formation_libelle,
        effectifs: repartition.effectifs,
      };
    });

    return <Component {...props} repartitionEffectifs={repartitionEffectifs} loading={isLoading} error={error} />;
  };

  WithRepartitionEffectifsReseauParNiveauEtAnneeFormation.propTypes = {
    filters: filtersPropTypes.state,
  };

  return WithRepartitionEffectifsReseauParNiveauEtAnneeFormation;
};

export default withRepartitionEffectifsReseauParNiveauEtAnneeFormation;
