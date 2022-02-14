import { Flex, Heading } from "@chakra-ui/react";
import React from "react";

import { ExportRepartitionByOrganismeButton, Section } from "../../../../common/components";
import RepartitionEffectifsParCfa from "../../../../common/components/tables/RepartitionEffectifsParCfa";
import useFetchEffectifsParCfa from "../../../../common/hooks/useFetchEffectifsParCfa";
import { filtersPropTypes } from "../../FiltersContext";

const RepartitionFormationParCfa = ({ filters }) => {
  const { data, isLoading, error } = useFetchEffectifsParCfa(filters);

  return (
    <Section paddingY="4w">
      <Flex justifyContent="space-between">
        <Heading as="h3" variant="h3">
          Répartition des effectifs
        </Heading>
        <ExportRepartitionByOrganismeButton />
      </Flex>
      <RepartitionEffectifsParCfa repartitionEffectifsParCfa={data} loading={isLoading} error={error} />
    </Section>
  );
};

RepartitionFormationParCfa.propTypes = {
  filters: filtersPropTypes.state,
};

export default RepartitionFormationParCfa;
