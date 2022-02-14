import PropTypes from "prop-types";
import React from "react";

import { Page } from "../../../../common/components";
import useFetchCfaInfo from "../../../../common/hooks/useFetchCfaInfo";
import { filtersPropTypes } from "../../FiltersContext";
import { effectifsPropType } from "../../propTypes";
import { IndicesHeaderSection, VueGlobaleSection } from "../../sections";
import { ActionsSection, CfaInformationSection, RepartitionSection } from "./sections";

const CfaView = ({ cfaUai, filters, effectifs, effectifsLoading }) => {
  const { data: infosCfa, loading: infosCfaLoading, error: infosCfaError } = useFetchCfaInfo(cfaUai);

  return (
    <Page>
      <IndicesHeaderSection />
      <CfaInformationSection infosCfa={infosCfa} loading={infosCfaLoading} error={infosCfaError} />
      {infosCfa && <ActionsSection infosCfa={infosCfa} />}
      <VueGlobaleSection effectifs={effectifs} loading={effectifsLoading} />
      <RepartitionSection filters={filters} />
    </Page>
  );
};

CfaView.propTypes = {
  cfaUai: PropTypes.string.isRequired,
  effectifs: effectifsPropType,
  effectifsLoading: PropTypes.bool.isRequired,
  filters: filtersPropTypes.state,
};

export default CfaView;
