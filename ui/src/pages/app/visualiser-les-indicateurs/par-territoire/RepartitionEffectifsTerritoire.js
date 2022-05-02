import React from "react";

import { filtersPropTypes } from "../FiltersContext";
import RepartitionEffectifsDepartement from "./RepartitionEffectifsDepartement";
import RepartitionEffectifsRegion from "./RepartitionEffectifsRegion";

const RepartitionEffectifsTerritoire = ({ filters }) => {
  if (filters.departement) {
    return <RepartitionEffectifsDepartement filters={filters} />;
  }
  if (filters.region) {
    return <RepartitionEffectifsRegion filters={filters} />;
  }
  return null;
};

RepartitionEffectifsTerritoire.propTypes = {
  filters: filtersPropTypes.state,
};

export default RepartitionEffectifsTerritoire;
