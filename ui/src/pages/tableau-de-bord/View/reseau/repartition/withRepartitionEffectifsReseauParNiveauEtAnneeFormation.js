import queryString from "query-string";
import React, { useEffect, useState } from "react";

import { _get } from "../../../../../common/httpClient";
import { omitNullishValues } from "../../../../../common/utils/omitNullishValues";
import { filtersPropTypes } from "../../../FiltersContext";

const DEFAULT_PAGE_SIZE = 10;

const buildSearchParams = (filters, pageNumber) => {
  const date = filters.date.toISOString();

  return queryString.stringify(
    omitNullishValues({
      date,
      etablissement_reseaux: filters.reseau.nom,
      etablissement_num_region: filters.region?.code ?? null,
      etablissement_num_departement: filters.departement?.code ?? null,
      page: pageNumber,
      limit: DEFAULT_PAGE_SIZE,
    })
  );
};

const withRepartitionEffectifsReseauParNiveauEtAnneeFormation = (Component) => {
  const WithRepartitionEffectifsReseauParNiveauEtAnneeFormation = ({ filters, ...props }) => {
    const [repartitionEffectifs, setRepartitionEffectifs] = useState(null);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [error, setError] = useState(null);

    const searchParamsString = buildSearchParams(filters, page);

    // if filters change, set page to 1
    useEffect(() => {
      setPage(1);
    }, [JSON.stringify(filters)]);

    useEffect(() => {
      const fetchData = async () => {
        setLoading(true);
        setError(null);

        try {
          const response = await _get(`/api/dashboard/effectifs-par-niveau-et-annee-formation?${searchParamsString}`);
          setRepartitionEffectifs(response);
        } catch (error) {
          setError(error);
        } finally {
          setLoading(false);
        }
      };

      fetchData();
    }, [searchParamsString]);

    return (
      <Component
        {...props}
        repartitionEffectifs={repartitionEffectifs}
        loading={loading}
        error={error}
        _setPage={setPage}
      />
    );
  };

  WithRepartitionEffectifsReseauParNiveauEtAnneeFormation.propTypes = {
    filters: filtersPropTypes.state,
  };

  return WithRepartitionEffectifsReseauParNiveauEtAnneeFormation;
};

export default withRepartitionEffectifsReseauParNiveauEtAnneeFormation;
