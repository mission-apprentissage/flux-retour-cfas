import { Heading, HStack, Skeleton } from "@chakra-ui/react";
import PropTypes from "prop-types";
import React from "react";

import { EffectifCard, Section } from "../../../../common/components";
import PeriodeFilter from "../../Filters/periode/PeriodeFilter";
import { useFiltersContext } from "../../FiltersContext";

const EffectifsSection = ({ effectifs, loading }) => {
  const filtersContext = useFiltersContext();

  let content = null;

  if (loading) {
    content = (
      <HStack spacing="2w">
        <Skeleton width="16rem" height="6rem" startColor="grey.300" endColor="galt" />
        <Skeleton width="16rem" height="6rem" startColor="grey.300" endColor="galt" />
        <Skeleton width="16rem" height="6rem" startColor="grey.300" endColor="galt" />
      </HStack>
    );
  }

  if (effectifs && !loading) {
    content = (
      <HStack spacing="2w">
        <EffectifCard count={effectifs.apprentis.count} label="apprentis" />
        <EffectifCard count={effectifs.inscrits.count} label="apprentis sans contrat" />
        <EffectifCard count={effectifs.abandons.count} label="abandons" />
      </HStack>
    );
  }

  return (
    <Section paddingY="4w">
      <HStack marginBottom="2w">
        <Heading as="h2" textStyle="h2">
          Effectifs
        </Heading>
        <PeriodeFilter value={filtersContext.state.date} onChange={filtersContext.setters.setDate} />
      </HStack>
      {content}
    </Section>
  );
};

EffectifsSection.propTypes = {
  loading: PropTypes.bool.isRequired,
  effectifs: PropTypes.shape({
    apprentis: PropTypes.shape({
      count: PropTypes.number.isRequired,
      evolution: PropTypes.number,
    }).isRequired,
    inscrits: PropTypes.shape({
      count: PropTypes.number.isRequired,
      evolution: PropTypes.number,
    }).isRequired,
    abandons: PropTypes.shape({
      count: PropTypes.number.isRequired,
      evolution: PropTypes.number,
    }).isRequired,
  }),
};

export default EffectifsSection;
