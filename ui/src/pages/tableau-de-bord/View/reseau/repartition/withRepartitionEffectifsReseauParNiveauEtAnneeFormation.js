import queryString from "query-string";
import React, { useEffect, useState } from "react";

import { _get } from "../../../../../common/httpClient";
import { omitNullishValues } from "../../../../../common/utils/omitNullishValues";
import { filtersPropTypes } from "../../../FiltersContext";

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
    const [repartitionEffectifs, setRepartitionEffectifs] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const searchParamsString = buildSearchParams(filters);

    useEffect(() => {
      const fetchData = async () => {
        setLoading(true);
        setError(null);

        try {
          const response = await _get(`/api/dashboard/effectifs-par-niveau-formation?${searchParamsString}`);
          setRepartitionEffectifs(response);
        } catch (error) {
          setError(error);
        } finally {
          setLoading(false);
        }
      };

      fetchData();
    }, [searchParamsString]);

    return <Component {...props} repartitionEffectifs={repartitionEffectifs} loading={loading} error={error} />;
  };

  WithRepartitionEffectifsReseauParNiveauEtAnneeFormation.propTypes = {
    filters: filtersPropTypes.state,
  };

  return WithRepartitionEffectifsReseauParNiveauEtAnneeFormation;
};

export default withRepartitionEffectifsReseauParNiveauEtAnneeFormation;
