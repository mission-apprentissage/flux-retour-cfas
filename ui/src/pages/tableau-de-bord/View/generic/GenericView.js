import PropTypes from "prop-types";
import React from "react";

import IndicesProvenanceSection from "../../IndicesProvenanceSection";
import { effectifsPropType } from "../../propTypes";
import EffectifsSection from "./EffectifsSection";

const GenericView = ({ effectifs, loading }) => {
  return (
    <>
      <IndicesProvenanceSection />
      <EffectifsSection effectifs={effectifs} loading={loading} />
    </>
  );
};

GenericView.propTypes = {
  effectifs: effectifsPropType,
  loading: PropTypes.bool.isRequired,
  error: PropTypes.object,
};

export default GenericView;
