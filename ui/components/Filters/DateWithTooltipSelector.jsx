import { HStack, Text, Tooltip } from "@chakra-ui/react";
import React from "react";
import { MonthSelect } from "../index.jsx";
import { InfoLine } from "../../theme/components/icons/InfoLine.js";
import { useSimpleFiltersContext } from "../../modules/mon-espace/landing/LandingOrganisme/SimpleFiltersContext.js";

const DateWithTooltipSelector = ({ ...props }) => {
  const { filtersValues, filtersSetters } = useSimpleFiltersContext();

  return (
    <HStack {...props}>
      <MonthSelect value={filtersValues.date} onChange={filtersSetters.setDate} />
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
        padding="2w"
      >
        <Text as="span">
          <InfoLine h="14px" w="14px" color="grey.500" ml="1v" mb="1v" />
        </Text>
      </Tooltip>
    </HStack>
  );
};

export default DateWithTooltipSelector;
