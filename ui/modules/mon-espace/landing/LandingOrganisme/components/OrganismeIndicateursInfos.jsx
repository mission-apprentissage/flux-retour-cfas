import React from "react";
import { Stack } from "@chakra-ui/react";

import DateWithTooltipSelector from "../../../../_old/visualiser-les-indicateurs/DateWithTooltipSelector.jsx";
import useFetchIndicateurs from "../../../../../hooks/old/useFetchIndicateurs.js";
import { useSimpleFiltersContext } from "../SimpleFiltersContext.js";
import IndicateursGridStack from "../../../../../components/IndicateursGridStack.jsx";

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
