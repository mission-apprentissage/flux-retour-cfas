import PropTypes from "prop-types";
import React from "react";

import { filtersPropTypes } from "../../../../components/_pagesComponents/FiltersContext.js";
import IndicateursAndRepartitionEffectifsDepartement from "./IndicateursAndRepartitionEffectifsDepartement";
import IndicateursAndRepartitionEffectifsNational from "./IndicateursAndRepartitionEffectifsNational";
import IndicateursAndRepartitionEffectifsRegion from "./IndicateursAndRepartitionEffectifsRegion";

const IndicateursAndRepartitionEffectifsTerritoire = ({ filters, effectifs, loading }) => {
  if (filters.departement) {
    return <IndicateursAndRepartitionEffectifsDepartement filters={filters} effectifs={effectifs} loading={loading} />;
  }
  if (filters.region) {
    return <IndicateursAndRepartitionEffectifsRegion filters={filters} effectifs={effectifs} loading={loading} />;
  }
  return <IndicateursAndRepartitionEffectifsNational effectifs={effectifs} loading={loading} />;
};

IndicateursAndRepartitionEffectifsTerritoire.propTypes = {
  filters: filtersPropTypes.state,
  loading: PropTypes.bool.isRequired,
  effectifs: PropTypes.shape({
    apprentis: PropTypes.PropTypes.number.isRequired,
    inscritsSansContrat: PropTypes.PropTypes.number.isRequired,
    abandons: PropTypes.PropTypes.number.isRequired,
    rupturants: PropTypes.PropTypes.number.isRequired,
  }),
};

export default IndicateursAndRepartitionEffectifsTerritoire;
