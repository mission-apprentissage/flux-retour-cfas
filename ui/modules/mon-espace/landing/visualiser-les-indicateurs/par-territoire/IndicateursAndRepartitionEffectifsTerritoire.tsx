import PropTypes from "prop-types";
import React from "react";

import { filtersPropTypes } from "../FiltersContext";
import { indicateursEffectifsSchema } from "../indicateursEffectifsSchema";

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
  ...indicateursEffectifsSchema,
};

export default IndicateursAndRepartitionEffectifsTerritoire;
