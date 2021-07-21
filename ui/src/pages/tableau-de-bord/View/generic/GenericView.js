import PropTypes from "prop-types";
import React from "react";

import ChiffresClesSection from "../../ChiffresClesSection/ChiffresClesSection";
import { filtersPropTypes } from "../../FiltersContext";
import IndicesProvenanceSection from "../../IndicesProvenanceSection";
import { effectifsPropType } from "../../propTypes";
import EffectifsSection from "./EffectifsSection";
import RepartitionEffectifsTerritoire from "./RepartitionEffectifsTerritoire";

const GenericView = ({ effectifs, loading, filters }) => {
  return (
    <>
      <IndicesProvenanceSection />
      <ChiffresClesSection />
      <EffectifsSection effectifs={effectifs} loading={loading} />
      <RepartitionEffectifsTerritoire filters={filters} />
    </>
  );
};

GenericView.propTypes = {
  effectifs: effectifsPropType,
  filters: filtersPropTypes.state,
  loading: PropTypes.bool.isRequired,
  error: PropTypes.object,
};

export default GenericView;
