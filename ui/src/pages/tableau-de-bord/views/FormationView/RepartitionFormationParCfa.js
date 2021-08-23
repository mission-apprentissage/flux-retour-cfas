import { Heading } from "@chakra-ui/react";
import PropTypes from "prop-types";
import React from "react";

import { Section } from "../../../../common/components";
import RepartitionEffectifsParCfa from "../../../../common/components/tables/RepartitionEffectifsParCfa";
import { filtersPropTypes } from "../../FiltersContext";
import withRepartitionFormationParCfa from "./withRepartitionFormationParCfaData";

const RepartitionEffectifsFormationParCfa = withRepartitionFormationParCfa(RepartitionEffectifsParCfa);

const RepartitionFormationParCfa = ({ formationCfd, filters }) => {
  return (
    <Section paddingY="4w">
      <Heading as="h3" variant="h3">
        Répartition des effectifs par organismes de formation
      </Heading>
      <RepartitionEffectifsFormationParCfa formationCfd={formationCfd} filters={filters} />
    </Section>
  );
};

RepartitionFormationParCfa.propTypes = {
  formationCfd: PropTypes.string.isRequired,
  filters: filtersPropTypes.state,
};

export default RepartitionFormationParCfa;
