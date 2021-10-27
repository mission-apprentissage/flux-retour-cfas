import PropTypes from "prop-types";
import React from "react";

import { getAuthUserNetwork, getAuthUserRole } from "../../../../common/auth/auth";
import { roles } from "../../../../common/auth/roles";
import { Page } from "../../../../common/components";
import { filtersPropTypes } from "../../FiltersContext";
import { effectifsPropType } from "../../propTypes";
import { EffectifsSection, IndicesHeaderSection, ProvenanceIndicesSection } from "../../sections";
import InfosReseauSection from "../ReseauView/InfosReseauSection";
import RepartitionEffectifsRegion from "./RepartitionEffectifsRegion";

const RegionView = ({ effectifs, loading, filters }) => {
  return (
    <Page>
      <IndicesHeaderSection />
      {getAuthUserRole() === roles.network && <InfosReseauSection reseau={getAuthUserNetwork()} />}
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
