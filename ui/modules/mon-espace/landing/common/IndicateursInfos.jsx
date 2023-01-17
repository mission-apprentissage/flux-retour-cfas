import React from "react";
import { Stack, Text } from "@chakra-ui/react";

import IndicateursGridStack from "../../../../components/IndicateursGridStack.jsx";
import useFetchIndicateurs from "../../../../hooks/useFetchIndicateurs.js";
import DateWithTooltipSelector from "../../../../components/Filters/DateWithTooltipSelector.jsx";
import { useSimpleFiltersContext } from "./SimpleFiltersContext.js";

// TODO : Voir si on conserve un seul composant commun avec filtre de date + autres filtres ?
export default function IndicateursInfo() {
  const { filtersValues } = useSimpleFiltersContext();
  const [indicateurs, loading, error] = useFetchIndicateurs(filtersValues);

  return (
    <Stack spacing="4w">
      <DateWithTooltipSelector />

      {error && (
        <Text color="error" marginTop="3w">
          Impossible de charger les effectifs
        </Text>
      )}

      {!error && (
        <IndicateursGridStack
          effectifs={indicateurs}
          loading={loading}
          showOrganismesCount={false}
          effectifsDate={filtersValues.date}
        />
      )}
    </Stack>
  );
}
