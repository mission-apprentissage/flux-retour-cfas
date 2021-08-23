import PropTypes from "prop-types";
import React from "react";

import { Page } from "../../../../common/components";
import { filtersPropTypes } from "../../FiltersContext";
import { effectifsPropType } from "../../propTypes";
import { EffectifsSection, IndicesHeaderSection } from "../../sections";
import CfaSection from "./InfosCfa/CfaSection";
import RepartionCfaNiveauAnneesSection from "./RepartionCfaNiveauAnneesSection";

const CfaView = ({ cfaUai, filters, effectifs, loading }) => {
  return (
    <Page>
      <IndicesHeaderSection />
      <CfaSection filters={filters} cfaUai={cfaUai} />
      {effectifs && <EffectifsSection effectifs={effectifs} loading={loading} />}
      <RepartionCfaNiveauAnneesSection filters={filters} />
    </Page>
  );
};

CfaView.propTypes = {
  effectifs: effectifsPropType,
  loading: PropTypes.bool.isRequired,
  cfaUai: PropTypes.string.isRequired,
  filters: filtersPropTypes.state,
};

export default CfaView;
