import PropTypes from "prop-types";
import React from "react";

import { Page } from "../../../../common/components";
import { filtersPropTypes } from "../../FiltersContext";
import { effectifsPropType } from "../../propTypes";
import { IndicesHeaderSection, VueGlobaleSection } from "../../sections";
import InfosFormationSection from "./InfosFormationSection";
import RepartitionFormationParCfa from "./RepartitionFormationParCfa";

const FormationView = ({ formationCfd, filters, effectifs, loading }) => {
  return (
    <Page>
      <IndicesHeaderSection />
      <InfosFormationSection formationCfd={formationCfd} />
      <VueGlobaleSection effectifs={effectifs} loading={loading} showOrganismesCount />
      <RepartitionFormationParCfa filters={filters} />
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
