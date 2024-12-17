import { Center, HStack, Spinner, Text, VStack } from "@chakra-ui/react";
import { captureException } from "@sentry/nextjs";
import { useQuery } from "@tanstack/react-query";
import type { CfdInfo } from "shared/models/apis/@types/ApiAlternance";

import { _get } from "@/common/httpClient";
import { formatDateDayMonthYear } from "@/common/utils/dateUtils";
import { Label } from "@/components/admin/organismes/recherche/Label";
import { niveauFormationByNiveau } from "@/modules/indicateurs/filters/FiltreFormationNiveau";

type CfdDetailsProps = {
  code: string | null;
};

export function CfdDetails(props: CfdDetailsProps) {
  const cfdInfoQuery = useQuery(["/api/v1/cfd", props.code ?? null], async ({ queryKey }) => {
    const [_, rncp] = queryKey;

    if (rncp) {
      return _get<CfdInfo | null>(`/api/v1/cfd/${rncp}`);
    }

    return null;
  });

  if (cfdInfoQuery.isLoading) {
    return (
      <Center h="100%">
        <Spinner />
      </Center>
    );
  }

  if (cfdInfoQuery.isError) {
    captureException(cfdInfoQuery.error, { extra: { code: props.code } });
    return <Text>Erreur lors de la récupération des informations CFD</Text>;
  }

  if (cfdInfoQuery.data === null) {
    return <Text>Diplome CFD non trouvée</Text>;
  }

  return (
    <VStack alignItems="start" gap={2}>
      <HStack>
        <Text>Code diplome&nbsp;:</Text>
        <Label value={props.code} />
      </HStack>
      <HStack>
        <Text>Intitulé&nbsp;:</Text>
        <Label value={cfdInfoQuery.data.intitule_long} />
      </HStack>
      <HStack>
        <Text>Niveau de formation&nbsp;:</Text>
        <Label
          value={niveauFormationByNiveau[cfdInfoQuery.data.niveau ?? ""] ?? "Inconnu"}
          level={cfdInfoQuery.data.niveau ? "info" : "error"}
        />
      </HStack>
      <HStack>
        <Text>Date ouverture&nbsp;:</Text>
        <Label
          value={
            cfdInfoQuery.data.date_ouverture ? formatDateDayMonthYear(cfdInfoQuery.data.date_ouverture) : "Inconnu"
          }
        />
      </HStack>
      <HStack>
        <Text>Date fermeture&nbsp;:</Text>
        <Label
          value={
            cfdInfoQuery.data.date_fermeture ? formatDateDayMonthYear(cfdInfoQuery.data.date_fermeture) : "Inconnu"
          }
        />
      </HStack>
    </VStack>
  );
}
