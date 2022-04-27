import React from "react";

import { filtersPropTypes } from "../../../tableau-de-bord/FiltersContext";
import RepartitionEffectifsDepartement from "../../../tableau-de-bord/views/DepartementView/RepartitionEffectifsDepartement";
import RepartitionEffectifsRegion from "../../../tableau-de-bord/views/RegionView/RepartitionEffectifsRegion";

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
  filters: filtersPropTypes,
};

export default RepartitionEffectifsTerritoire;
