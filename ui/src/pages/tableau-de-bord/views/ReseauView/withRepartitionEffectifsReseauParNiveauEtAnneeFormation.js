import queryString from "query-string";
import React from "react";

import { useFetch } from "../../../../common/hooks/useFetch";
import { omitNullishValues } from "../../../../common/utils/omitNullishValues";
import { filtersPropTypes } from "../../FiltersContext";

const buildSearchParams = (filters) => {
  const date = filters.date.toISOString();

  return queryString.stringify(
    omitNullishValues({
      date,
      etablissement_reseaux: filters.reseau.nom,
      etablissement_num_region: filters.region?.code ?? null,
      etablissement_num_departement: filters.departement?.code ?? null,
    })
  );
};

const withRepartitionEffectifsReseauParNiveauEtAnneeFormation = (Component) => {
  const WithRepartitionEffectifsReseauParNiveauEtAnneeFormation = ({ filters, ...props }) => {
    const searchParamsString = buildSearchParams(filters);
    const [data, loading, error] = useFetch(`/api/dashboard/effectifs-par-niveau-formation?${searchParamsString}`);

    const repartitionEffectifs = data?.map((repartition) => {
      return { niveauFormation: repartition.niveau_formation, effectifs: repartition.effectifs };
    });

    return <Component {...props} repartitionEffectifs={repartitionEffectifs} loading={loading} error={error} />;
  };

  WithRepartitionEffectifsReseauParNiveauEtAnneeFormation.propTypes = {
    filters: filtersPropTypes.state,
  };

  return WithRepartitionEffectifsReseauParNiveauEtAnneeFormation;
};

export default withRepartitionEffectifsReseauParNiveauEtAnneeFormation;
