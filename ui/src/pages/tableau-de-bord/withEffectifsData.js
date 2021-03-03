/* eslint-disable react/display-name */
import React, { useState } from "react";

import { _post } from "../../common/httpClient";

const computeEvolutionPercent = (count1, count2) => {
  if (count2 === 0) return null;
  return ((count1 - count2) * 100) / count2;
};

const mapEffectifsData = (effectifsData) => {
  const [start, end] = effectifsData;
  return {
    apprentis: {
      count: end.apprentis,
      evolution: computeEvolutionPercent(end.apprentis, start.apprentis),
    },
    inscrits: {
      count: end.inscrits,
      evolution: computeEvolutionPercent(end.inscrits, start.inscrits),
    },
    abandons: {
      count: end.abandons,
      evolution: computeEvolutionPercent(end.abandons, start.abandons),
    },
  };
};

// map filters to the expected body shape in our API and filter out null values
const buildSearchRequestBody = (filters) => {
  const flattenedFilters = {
    startDate: filters.periode.startDate?.toISOString(),
    endDate: filters.periode.endDate?.toISOString(),
    etablissement_num_region: filters.territoire?.type === "region" ? filters.territoire.code : null,
    etablissement_num_departement: filters.territoire?.type === "departement" ? filters.territoire.code : null,
    id_formation: filters.formation?.cfd || null,
    siret_etablissement: filters.cfa?.siret_etablissement || null,
  };

  return Object.entries(flattenedFilters).reduce((acc, [key, value]) => {
    return value ? { ...acc, [key]: value } : acc;
  }, {});
};

const withEffectifsData = (Comp) => (props) => {
  const [effectifs, setEffectifs] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchEffectifs = async (filters) => {
    setLoading(true);
    try {
      const response = await _post("/api/dashboard/effectifs", buildSearchRequestBody(filters));
      setEffectifs(mapEffectifsData(response));
      setError(null);
    } catch (err) {
      setError(err);
      setEffectifs(null);
    } finally {
      setLoading(false);
    }
  };

  return <Comp {...props} fetchEffectifs={fetchEffectifs} effectifs={effectifs} loading={loading} error={error} />;
};

export default withEffectifsData;
