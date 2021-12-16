import PropTypes from "prop-types";
import React from "react";

import { DataNetworkAlert, Page } from "../../../../common/components";
import { filtersPropTypes } from "../../FiltersContext";
import { effectifsPropType } from "../../propTypes";
import { IndicesHeaderSection, VueGlobaleSection } from "../../sections";
import InfosReseauSection from "./InfosReseauSection";
import RepartitionEffectifsReseau from "./RepartitionEffectifsReseau";

const RESEAU_WITH_DATA_ALERT = "MFR";

const ReseauView = ({ reseau, effectifs, filters, loading }) => {
  return (
    <Page>
      <IndicesHeaderSection />
      <InfosReseauSection reseau={reseau} />
      {reseau === RESEAU_WITH_DATA_ALERT && <DataNetworkAlert paddingY="4w" />}
      <VueGlobaleSection effectifs={effectifs} loading={loading} showOrganismesCount />
      <RepartitionEffectifsReseau filters={filters} />
    </Page>
  );
};

ReseauView.propTypes = {
  effectifs: effectifsPropType,
  loading: PropTypes.bool.isRequired,
  filters: filtersPropTypes.state,
  reseau: PropTypes.string.isRequired,
};

export default ReseauView;
