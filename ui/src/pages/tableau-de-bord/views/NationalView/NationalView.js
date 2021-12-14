import PropTypes from "prop-types";
import React from "react";

import { Page } from "../../../../common/components";
import { effectifsPropType } from "../../propTypes";
import { EffectifsSection, IndicesHeaderSection, ProvenanceIndicesSection } from "../../sections";

const NationalView = ({ effectifs, loading }) => {
  return (
    <Page>
      <IndicesHeaderSection />
      <ProvenanceIndicesSection />
      <EffectifsSection effectifs={effectifs} loading={loading} />
    </Page>
  );
};

NationalView.propTypes = {
  effectifs: effectifsPropType,
  loading: PropTypes.bool.isRequired,
};

export default NationalView;
