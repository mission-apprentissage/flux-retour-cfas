import PropTypes from "prop-types";
import React from "react";

import { filtersPropTypes } from "../FiltersContext";
import IndicateursAndRepartitionEffectifsDepartement from "./IndicateursAndRepartitionEffectifsDepartement";
import IndicateursAndRepartitionEffectifsNational from "./IndicateursAndRepartitionEffectifsNational";
import IndicateursAndRepartitionEffectifsRegion from "./IndicateursAndRepartitionEffectifsRegion";

const IndicateursAndRepartitionEffectifsTerritoire = ({ filters, effectifs, loading, showOrganismesCount = true }) => {
  if (filters.departement) {
    return (
      <IndicateursAndRepartitionEffectifsDepartement
        filters={filters}
        effectifs={effectifs}
        loading={loading}
        showOrganismesCount={showOrganismesCount}
      />
    );
  }
  if (filters.region) {
    return (
      <IndicateursAndRepartitionEffectifsRegion
        filters={filters}
        effectifs={effectifs}
        loading={loading}
        showOrganismesCount={showOrganismesCount}
      />
    );
  }
  return (
    <IndicateursAndRepartitionEffectifsNational
      effectifs={effectifs}
      loading={loading}
      showOrganismesCount={showOrganismesCount}
    />
  );
};

IndicateursAndRepartitionEffectifsTerritoire.propTypes = {
  filters: filtersPropTypes.state,
  loading: PropTypes.bool.isRequired,
  showOrganismesCount: PropTypes.bool,
  effectifs: PropTypes.shape({
    apprentis: PropTypes.shape({
      count: PropTypes.number.isRequired,
    }).isRequired,
    inscritsSansContrat: PropTypes.shape({
      count: PropTypes.number.isRequired,
    }).isRequired,
    abandons: PropTypes.shape({
      count: PropTypes.number.isRequired,
    }).isRequired,
    rupturants: PropTypes.shape({
      count: PropTypes.number.isRequired,
    }).isRequired,
  }),
};

export default IndicateursAndRepartitionEffectifsTerritoire;
