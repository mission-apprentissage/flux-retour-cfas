import PropTypes from "prop-types";
import React from "react";

import { Page } from "../../../../common/components";
import { filtersPropTypes } from "../../FiltersContext";
import { effectifsPropType } from "../../propTypes";
import { IndicesHeaderSection, VueGlobaleSection } from "../../sections";
import { infosCfaPropType } from "./propTypes";
import { ActionsSection, CfaInformationSection, RepartitionSection } from "./sections";
import withInfoCfaData from "./withInfoCfaData";

const CfaView = ({ infosCfa, filters, effectifs, loading, error }) => {
  return (
    <Page>
      <IndicesHeaderSection />
      <CfaInformationSection infosCfa={infosCfa} loading={loading} error={error} />
      {infosCfa && <ActionsSection infosCfa={infosCfa} />}
      <VueGlobaleSection effectifs={effectifs} loading={loading} />
      <RepartitionSection filters={filters} />
    </Page>
  );
};

CfaView.propTypes = {
  infosCfa: infosCfaPropType,
  effectifs: effectifsPropType,
  loading: PropTypes.bool.isRequired,
  error: PropTypes.object,
  filters: filtersPropTypes.state,
};

export default withInfoCfaData(CfaView);
