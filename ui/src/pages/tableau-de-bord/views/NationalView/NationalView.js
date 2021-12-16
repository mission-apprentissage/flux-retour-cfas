import PropTypes from "prop-types";
import React from "react";

import { Page } from "../../../../common/components";
import { effectifsPropType } from "../../propTypes";
import { IndicesHeaderSection, VueGlobaleSection } from "../../sections";

const NationalView = ({ effectifs, loading }) => {
  return (
    <Page>
      <IndicesHeaderSection />
      <VueGlobaleSection effectifs={effectifs} loading={loading} showOrganismesCount />
    </Page>
  );
};

NationalView.propTypes = {
  effectifs: effectifsPropType,
  loading: PropTypes.bool.isRequired,
};

export default NationalView;
