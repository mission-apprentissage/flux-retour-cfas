import React from "react";
import { Stack } from "@chakra-ui/react";

import { useSimpleFiltersContext } from "../SimpleFiltersContext.js";
import IndicateursGridStack from "../../../../../components/IndicateursGridStack.jsx";
import useFetchIndicateurs from "../../../../../hooks/useFetchIndicateurs.js";
import DateWithTooltipSelector from "../../../../../components/Filters/DateWithTooltipSelector.jsx";

export default function OrganismeIndicateursInfo() {
  const { filtersValues } = useSimpleFiltersContext();
  const [indicateurs, loading] = useFetchIndicateurs(filtersValues);

  return (
    <Stack>
      <DateWithTooltipSelector />

      <IndicateursGridStack
        effectifs={indicateurs}
        loading={loading}
        showOrganismesCount={false}
        effectifsDate={filtersValues.date}
      />
    </Stack>
  );
}
