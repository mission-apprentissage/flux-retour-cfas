import React from "react";
import { Stack, Text } from "@chakra-ui/react";

import useFetchIndicateursNational from "../../../../hooks/useFetchIndicateursNational.js";
import DateWithTooltipSelector from "../../../../components/Filters/DateWithTooltipSelector.jsx";
import { useSimpleFiltersContext } from "../LandingOrganisme/SimpleFiltersContext.js";
import IndicateursGridStack from "../../../../components/IndicateursGridStack.jsx";

// TODO Mettre les indicateurs scopés pour le pilote
export default function PilotIndicateursInfos() {
  const { filtersValues } = useSimpleFiltersContext();
  const { data, loading, error } = useFetchIndicateursNational(filtersValues?.date);

  return (
    <Stack>
      {error && (
        <Text color="error" marginTop="3w">
          Impossible de charger les effectifs au national
        </Text>
      )}

      {data && !error && (
        <>
          <Text fontStyle="italic" color="grey.800">
            Au national <DateWithTooltipSelector /> <br />
          </Text>

          <IndicateursGridStack
            effectifs={data}
            loading={loading}
            showOrganismesCount={false}
            effectifsDate={filtersValues.date}
          />
        </>
      )}
    </Stack>
  );
}
