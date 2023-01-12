import React from "react";
import { Stack } from "@chakra-ui/react";

import DateWithTooltipSelector from "../../../../_old/visualiser-les-indicateurs/DateWithTooltipSelector.jsx";
import { useSimpleFiltersContext } from "../SimpleFiltersContext.js";

export default function OrganismeIndicateursInfo() {
  const { filtersValues } = useSimpleFiltersContext();

  // TODO call useIndicateurs

  return (
    <Stack>
      <DateWithTooltipSelector />
      {/* Debug */}
      <p>{JSON.stringify(filtersValues)}</p>
      {/* TODO add indicateur grid stack */}
    </Stack>
  );
}
