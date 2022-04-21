import { Heading, HStack, Text, Tooltip } from "@chakra-ui/react";
import React from "react";

import { Section } from "../../../../../../common/components";
import RepartitionEffectifsParSiret from "../../../../../../common/components/tables/RepartitionEffectifsParSiretAndDepartement";
import useFetchEffectifsParSiret from "../../../../../../common/hooks/useFetchEffectifsParSiret";
import { InfoLine } from "../../../../../../theme/components/icons";
import { filtersPropTypes, useFiltersContext } from "../../../../FiltersContext";
import DateFilter from "../../../../sections/VueGlobaleSection/DateFilter";

const RepartitionEffectifsParSiretSection = ({ filters }) => {
  const { data, loading, error } = useFetchEffectifsParSiret(filters);
  const filtersContext = useFiltersContext();

  return (
    <Section paddingY="4w">
      <HStack marginBottom="2w">
        <Heading as="h2" variant="h2">
          Répartition des effectifs par SIRET
        </Heading>

        <DateFilter value={filtersContext.state.date} onChange={filtersContext.setters.setDate} />
        <Tooltip
          label={
            <Text>
              La sélection du mois permet d&apos;afficher les effectifs au dernier jour du mois. <br />
              <br /> A noter : la période de référence pour l&apos;année scolaire court du 1er août au 31 juillet
            </Text>
          }
          aria-label="A tooltip"
          background="bluefrance"
          color="white"
          padding={5}
        >
          <Text as="span">
            <InfoLine h="14px" w="14px" color="grey.500" ml={1} mb={1} />
          </Text>
        </Tooltip>
      </HStack>

      <RepartitionEffectifsParSiret effectifs={data} loading={loading} error={error} />
    </Section>
  );
};

RepartitionEffectifsParSiretSection.propTypes = {
  filters: filtersPropTypes.state,
};

export default RepartitionEffectifsParSiretSection;
