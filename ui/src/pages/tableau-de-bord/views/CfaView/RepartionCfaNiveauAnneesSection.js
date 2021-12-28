import { Heading } from "@chakra-ui/react";
import React from "react";

import { Section } from "../../../../common/components";
import RepartitionEffectifsParFormation from "../../../../common/components/tables/RepartitionEffectifsParFormation";
import useFetchEffectifsParNiveauFormation from "../../../../common/hooks/useFetchEffectifsParNiveauFormation";
import { filtersPropTypes } from "../../FiltersContext";

const RepartionCfaNiveauAnneesSection = ({ filters }) => {
  const { data, loading, error } = useFetchEffectifsParNiveauFormation(filters);

  return (
    <Section paddingY="4w">
      <Heading as="h3" variant="h3">
        Répartition des effectifs
      </Heading>
      <RepartitionEffectifsParFormation repartitionEffectifs={data} loading={loading} error={error} />
    </Section>
  );
};

RepartionCfaNiveauAnneesSection.propTypes = {
  filters: filtersPropTypes.state,
};

export default RepartionCfaNiveauAnneesSection;
