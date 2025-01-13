import { Center, HStack, Link, Spinner, Text, VStack } from "@chakra-ui/react";
import { captureException } from "@sentry/nextjs";
import { useQuery } from "@tanstack/react-query";
import type { RncpInfo } from "shared/models/apis/@types/ApiAlternance";

import { _get } from "@/common/httpClient";
import { formatDateDayMonthYear } from "@/common/utils/dateUtils";
import { Label } from "@/components/admin/organismes/recherche/Label";
import { niveauFormationByNiveau } from "@/modules/indicateurs/filters/FiltreFormationNiveau";

type RncpDetailsProps = {
  code: string | null;
};

export function RncpDetails(props: RncpDetailsProps) {
  const rncpInfoQuery = useQuery(["/api/v1/rncp", props.code ?? null], async ({ queryKey }) => {
    const [_, rncp] = queryKey;

    if (rncp) {
      return _get<RncpInfo | null>(`/api/v1/rncp/${rncp}`);
    }

    return null;
  });

  if (rncpInfoQuery.isLoading) {
    return (
      <Center h="100%">
        <Spinner />
      </Center>
    );
  }

  if (rncpInfoQuery.isError) {
    captureException(rncpInfoQuery.error, { extra: { code: props.code } });
    return <Text>Erreur lors de la récupération des informations RNCP</Text>;
  }

  if (rncpInfoQuery.data === null) {
    return <Text>Fiche RNCP non trouvée</Text>;
  }

  return (
    <VStack alignItems="start" gap={2}>
      <HStack w="100%">
        <Text>Code RNCP&nbsp;:</Text>
        <Label value={rncpInfoQuery.data.code_rncp} />

        <Link
          variant="whiteBg"
          href={`https://www.francecompetences.fr/recherche/rncp/${rncpInfoQuery.data.code_rncp.substring(4)}`}
          isExternal
          ml="auto !important"
        >
          Consulter la fiche
        </Link>
      </HStack>
      <HStack>
        <Text>Intitulé&nbsp;:</Text>
        <Label value={rncpInfoQuery.data.intitule} />
      </HStack>
      <HStack>
        <Text>Actif&nbsp;:</Text>
        <Label value={rncpInfoQuery.data.actif} level={rncpInfoQuery.data.actif ? "success" : "error"} />
      </HStack>
      <HStack>
        <Text>Niveau de formation&nbsp;:</Text>
        <Label
          value={niveauFormationByNiveau[rncpInfoQuery.data.niveau ?? ""] ?? "Inconnu"}
          level={rncpInfoQuery.data.niveau ? "info" : "error"}
        />
      </HStack>
      <HStack>
        <Text>Date fin validité&nbsp;:</Text>
        <Label
          value={
            rncpInfoQuery.data.date_fin_validite_enregistrement
              ? formatDateDayMonthYear(rncpInfoQuery.data.date_fin_validite_enregistrement)
              : "Inconnu"
          }
        />
      </HStack>
      <HStack>
        <Text>Eligible apprentissage&nbsp;:</Text>
        <Label
          value={rncpInfoQuery.data.eligible_apprentissage}
          level={rncpInfoQuery.data.eligible_professionnalisation ? "success" : "error"}
        />
      </HStack>
      <HStack>
        <Text>Eligible professionnalisation&nbsp;:</Text>
        <Label value={rncpInfoQuery.data.eligible_professionnalisation} />
      </HStack>
      <HStack>
        <Text>Codes ROME&nbsp;:</Text>
        {rncpInfoQuery.data.romes.map((rome) => (
          <Label key={rome.code} value={`${rome.code}: ${rome.intitule}`} />
        ))}
      </HStack>
    </VStack>
  );
}
