import PropTypes from "prop-types";
import React from "react";

import { Page } from "../../../../common/components";
import { filtersPropTypes } from "../../FiltersContext";
import { effectifsPropType } from "../../propTypes";
import { IndicesHeaderSection, VueGlobaleSection } from "../../sections";
import RepartitionEffectifsReseau from "./RepartitionEffectifsReseau";
import ReseauInfoBanner from "./ReseauInfoBanner";

const ReseauView = ({ effectifs, filters, loading }) => {
  return (
    <Page>
      <IndicesHeaderSection />
      <ReseauInfoBanner nomReseau={filters?.reseau?.nom} />
      <VueGlobaleSection effectifs={effectifs} loading={loading} showOrganismesCount />
      <RepartitionEffectifsReseau filters={filters} />
    </Page>
  );
};

ReseauView.propTypes = {
  effectifs: effectifsPropType,
  loading: PropTypes.bool.isRequired,
  filters: filtersPropTypes.state,
};

export default ReseauView;
