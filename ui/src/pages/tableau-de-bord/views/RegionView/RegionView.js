import PropTypes from "prop-types";
import React from "react";

import { Page } from "../../../../common/components";
import { filtersPropTypes } from "../../FiltersContext";
import { effectifsPropType } from "../../propTypes";
import { EffectifsSection, IndicesHeaderSection, ProvenanceIndicesSection } from "../../sections";
import RepartitionEffectifsRegion from "./RepartitionEffectifsRegion";

const RegionView = ({ effectifs, loading, filters }) => {
  return (
    <Page>
      <IndicesHeaderSection />
      <ProvenanceIndicesSection />
      <EffectifsSection effectifs={effectifs} loading={loading} />
      <RepartitionEffectifsRegion filters={filters} />
    </Page>
  );
};

RegionView.propTypes = {
  effectifs: effectifsPropType,
  filters: filtersPropTypes.state,
  loading: PropTypes.bool.isRequired,
  error: PropTypes.object,
};

export default RegionView;
