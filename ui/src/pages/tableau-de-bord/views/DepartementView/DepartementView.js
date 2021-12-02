import PropTypes from "prop-types";
import React from "react";

import { Page } from "../../../../common/components";
import { filtersPropTypes } from "../../FiltersContext";
import { effectifsPropType } from "../../propTypes";
import { EffectifsSection, IndicesHeaderSection, ProvenanceIndicesSection } from "../../sections";
import RepartitionEffectifsTerritoire from "./RepartitionEffectifsTerritoire";

const GenericView = ({ effectifs, loading, filters }) => {
  return (
    <Page>
      <IndicesHeaderSection />
      <ProvenanceIndicesSection />
      <EffectifsSection effectifs={effectifs} loading={loading} />
      <RepartitionEffectifsTerritoire filters={filters} />
    </Page>
  );
};

GenericView.propTypes = {
  effectifs: effectifsPropType,
  filters: filtersPropTypes.state,
  loading: PropTypes.bool.isRequired,
  error: PropTypes.object,
};

export default GenericView;
