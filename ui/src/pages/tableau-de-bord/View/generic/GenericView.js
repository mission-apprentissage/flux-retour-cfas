import PropTypes from "prop-types";
import React from "react";

import { effectifsPropType } from "../../propTypes";
import EffectifsSection from "./EffectifsSection";

const GenericView = ({ effectifs, loading }) => {
  return (
    <>
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
