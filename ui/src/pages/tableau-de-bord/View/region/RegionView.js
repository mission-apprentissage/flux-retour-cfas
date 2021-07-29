import PropTypes from "prop-types";
import React from "react";

import { filtersPropTypes } from "../../FiltersContext";
import IndicesProvenanceSection from "../../IndicesProvenanceSection";
import { effectifsPropType } from "../../propTypes";
import EffectifsSection from "../generic/EffectifsSection";
import RepartitionEffectifsRegion from "./RepartitionEffectifsRegion";

const RegionView = ({ effectifs, loading, filters }) => {
  return (
    <>
      <IndicesProvenanceSection />
      <EffectifsSection effectifs={effectifs} loading={loading} />
      <RepartitionEffectifsRegion filters={filters} />
    </>
  );
};

RegionView.propTypes = {
  effectifs: effectifsPropType,
  filters: filtersPropTypes.state,
  loading: PropTypes.bool.isRequired,
  error: PropTypes.object,
};

export default RegionView;
