import PropTypes from "prop-types";
import React from "react";

import { Page } from "../../../../common/components";
import { filtersPropTypes } from "../../FiltersContext";
import { effectifsPropType } from "../../propTypes";
import { EffectifsSection, IndicesHeaderSection, ProvenanceIndicesSection } from "../../sections";
import InfosFormationSection from "./InfosFormationSection";
import RepartitionFormationParCfa from "./RepartitionFormationParCfa";

const FormationView = ({ formationCfd, filters, effectifs, loading }) => {
  return (
    <Page>
      <IndicesHeaderSection />
      <InfosFormationSection formationCfd={formationCfd} />
      <ProvenanceIndicesSection />
      <EffectifsSection effectifs={effectifs} loading={loading} />
      <RepartitionFormationParCfa formationCfd={formationCfd} filters={filters} />
    </Page>
  );
};

FormationView.propTypes = {
  effectifs: effectifsPropType,
  loading: PropTypes.bool.isRequired,
  formationCfd: PropTypes.string.isRequired,
  filters: filtersPropTypes.state,
};

export default FormationView;
