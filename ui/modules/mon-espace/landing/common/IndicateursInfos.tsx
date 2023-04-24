import { Stack, Text } from "@chakra-ui/react";
import React from "react";

import DateWithTooltipSelector from "@/components/Filters/DateWithTooltipSelector";
import IndicateursGridStack from "@/components/IndicateursGridStack";
import { useFetchOrganismeIndicateurs } from "@/hooks/organismes";

import { useSimpleFiltersContext } from "./SimpleFiltersContext";

// TODO : Voir si on conserve un seul composant commun avec filtre de date + autres filtres ?
export default function IndicateursInfos({ organismeId }: { organismeId: string }) {
  const { filtersValues } = useSimpleFiltersContext();
  const { indicateurs, isLoading, error } = useFetchOrganismeIndicateurs(organismeId);

  return (
    <Stack spacing="4w">
      <>
        <DateWithTooltipSelector />

        {error && (
          <Text color="error" marginTop="3w">
            Impossible de charger les effectifs
          </Text>
        )}

        {!error && (
          <IndicateursGridStack
            effectifs={indicateurs}
            loading={isLoading}
            showOrganismesCount={false}
            effectifsDate={filtersValues.date}
          />
        )}
      </>
    </Stack>
  );
}
