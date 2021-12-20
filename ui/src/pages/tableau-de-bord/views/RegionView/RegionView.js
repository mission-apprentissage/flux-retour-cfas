import PropTypes from "prop-types";
import React from "react";

import { Page } from "../../../../common/components";
import { filtersPropTypes } from "../../FiltersContext";
import { effectifsPropType } from "../../propTypes";
import { IndicesHeaderSection, VueGlobaleSection } from "../../sections";
import RepartitionEffectifsRegion from "./RepartitionEffectifsRegion";

const RegionView = ({ effectifs, loading, filters }) => {
  return (
    <Page>
      <IndicesHeaderSection />
      <VueGlobaleSection effectifs={effectifs} loading={loading} showOrganismesCount />
      <RepartitionEffectifsRegion filters={filters} />
    </Page>
  );
};

RegionView.propTypes = {
  effectifs: effectifsPropType,
  filters: filtersPropTypes.state,
  loading: PropTypes.bool.isRequired,
};

export default RegionView;
