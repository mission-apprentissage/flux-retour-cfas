import { Center, Heading, Spinner, Box, Flex, Text, HStack, VStack, Switch, Container } from "@chakra-ui/react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import groupBy from "lodash.groupby";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRecoilValue, useSetRecoilState } from "recoil";
import { getAnneeScolaireFromDate, getSIFADate } from "shared";

import { _get, _getBlob } from "@/common/httpClient";
import { downloadObject } from "@/common/utils/browser";
import DownloadButton from "@/components/buttons/DownloadButton";
import { organismeAtom } from "@/hooks/organismeAtoms";
import { usePlausibleTracking } from "@/hooks/plausible";
import useToaster from "@/hooks/useToaster";
import { effectifsStateAtom } from "@/modules/mon-espace/effectifs/engine/atoms";
import EffectifsTable from "@/modules/mon-espace/effectifs/engine/EffectifsTable";
import { Input } from "@/modules/mon-espace/effectifs/engine/formEngine/components/Input/Input";
import { DoubleChevrons } from "@/theme/components/icons/DoubleChevrons";

function useOrganismesEffectifs(organismeId: string) {
  const setCurrentEffectifsState = useSetRecoilState(effectifsStateAtom);
  const queryClient = useQueryClient();
  const prevOrganismeId = useRef<string | null>(null);

  useEffect(() => {
    if (prevOrganismeId.current !== organismeId) {
      prevOrganismeId.current = organismeId;
      // FIXME, reset toutes les queries ?!
      // queryClient.resetQueries("organismesEffectifs", { exact: true });
    }
  }, [queryClient, organismeId]);

  const { data, isLoading, isFetching } = useQuery<any, any>(["organismesEffectifs", organismeId], async () => {
    const organismesEffectifs = await _get(`/api/v1/organismes/${organismeId}/effectifs?sifa=true`);
    const newEffectifsState = new Map();
    for (const { id, validation_errors, requiredSifa } of organismesEffectifs as any) {
      newEffectifsState.set(id, { validation_errors, requiredSifa });
    }
    setCurrentEffectifsState(newEffectifsState);
    return organismesEffectifs;
  });

  return { isLoading: isFetching || isLoading, organismesEffectifs: data || [] };
}

const EffectifsTableContainer = ({ effectifs, formation, canEdit, searchValue, ...props }) => {
  const [count, setCount] = useState(effectifs.length);
  return (
    <Box {...props}>
      {count !== 0 && (
        <HStack>
          <DoubleChevrons />
          <Text fontWeight="bold" textDecoration="underline">
            {formation.libelle_long}
          </Text>
          <Text>
            [Code diplôme {formation.cfd}] - [Code RNCP {formation.rncp}]
          </Text>
        </HStack>
      )}
      <EffectifsTable
        canEdit={canEdit}
        organismesEffectifs={effectifs}
        searchValue={searchValue}
        onCountItemsChange={(count) => setCount(count)}
        modeSifa
      />
    </Box>
  );
};

interface SIFAPageProps {
  modePublique: boolean;
}

const SIFAPage = (props: SIFAPageProps) => {
  const { trackPlausibleEvent } = usePlausibleTracking();
  const { toastWarning } = useToaster();
  const organisme = useRecoilValue<any>(organismeAtom);
  const { isLoading, organismesEffectifs } = useOrganismesEffectifs(organisme._id);

  const [searchValue, setSearchValue] = useState("");

  const organismesEffectifsGroupedBySco: any = useMemo(
    () => groupBy(organismesEffectifs, "annee_scolaire"),
    [organismesEffectifs]
  );
  const [showOnlyMissingSifa, setShowOnlyMissingSifa] = useState(false);

  if (isLoading) {
    return (
      <Center>
        <Spinner />
      </Center>
    );
  }

  return (
    <Container maxW="xl" p="8">
      <Flex as="nav" align="center" justify="space-between" wrap="wrap" w="100%" alignItems="flex-start">
        <Heading as="h1" color="#465F9D" fontSize="beta" fontWeight="700" mb={8}>
          {props.modePublique ? "Son" : "Mon"} Enquête SIFA
        </Heading>
        <HStack spacing={4}>
          <DownloadButton
            variant="secondary"
            action={async () => {
              trackPlausibleEvent("telechargement_sifa");
              downloadObject(
                await _getBlob(`/api/v1/organismes/${organisme._id}/sifa-export`),
                `tdb-données-sifa-${
                  organisme.enseigne ?? organisme.raison_sociale ?? "Organisme inconnu"
                }-${new Date().toLocaleDateString()}.csv`,
                "text/plain"
              );
              const nbEffectifsInvalides = organismesEffectifs.filter(
                (effectif) => effectif.requiredSifa.length > 0
              ).length;
              toastWarning(
                `Parmi les ${organismesEffectifs.length} effectifs que vous avez déclarés, ${nbEffectifsInvalides} d'entre eux ne comportent pas l'ensemble des informations requises pour l'enquête SIFA. Si vous ne les corrigez/complétez pas, votre fichier risque d'être rejeté. Vous pouvez soit les éditer directement sur la plateforme soit modifier votre fichier sur votre ordinateur.`,
                {
                  isClosable: true,
                  duration: 20000,
                }
              );
            }}
          >
            Télécharger le fichier SIFA
          </DownloadButton>
        </HStack>
      </Flex>

      <VStack alignItems="flex-start">
        <Text fontWeight="bold">
          Vous avez {organismesEffectifs.length} effectifs au total, en contrat au 31 décembre{" "}
          {getSIFADate(new Date()).getUTCFullYear()}, sur l&apos;année scolaire{" "}
          {getAnneeScolaireFromDate(getSIFADate(new Date()))}. Pour plus de facilité, vous pouvez effectuer une
          recherche, ou filtrer par année.
        </Text>
        <Input
          name="search_effectifs"
          placeholder="Recherche"
          fieldType="text"
          mask="C"
          maskBlocks={[
            {
              name: "C",
              mask: "Pattern",
              pattern: "^.*$",
            },
          ]}
          onSubmit={(value) => setSearchValue(value.trim())}
          value={searchValue}
          w="35%"
        />
      </VStack>

      <VStack alignItems="flex-start" mt={8}>
        <HStack w="full">
          <Box fontWeight="bold" flexGrow={1}>
            Filtrer:
          </Box>
          <HStack>
            <Switch
              variant="icon"
              isChecked={showOnlyMissingSifa}
              onChange={(e) => {
                setShowOnlyMissingSifa(e.target.checked);
              }}
            />
            <Text flexGrow={1}>Afficher uniquement les données manquantes pour SIFA</Text>
          </HStack>
        </HStack>
      </VStack>

      <Box mt={10} mb={16}>
        {Object.entries(organismesEffectifsGroupedBySco).map(([anneSco, orgaE]: [string, any]) => {
          const orgaEffectifs = showOnlyMissingSifa ? orgaE.filter((ef) => ef.requiredSifa.length) : orgaE;
          const effectifsByCfd = groupBy(orgaEffectifs, "formation.cfd");
          return (
            <Box key={anneSco} mb={5}>
              <Text>
                {anneSco} {!searchValue ? `- ${orgaEffectifs.length} apprenant(es) total` : ""}
              </Text>
              <Box p={4} style={{ borderColor: "dgalt", borderWidth: 1 }}>
                {Object.entries(effectifsByCfd).map(([cfd, effectifs]: [string, any[]], i) => {
                  const { formation } = effectifs[0];
                  return (
                    <EffectifsTableContainer
                      key={anneSco + cfd}
                      canEdit={true} // FIXME organisation liée à l'organisme uniquement ?
                      effectifs={effectifs}
                      formation={formation}
                      searchValue={searchValue}
                      {...(i === 0 ? {} : { mt: 14 })}
                    />
                  );
                })}
              </Box>
            </Box>
          );
        })}
      </Box>
    </Container>
  );
};

export default SIFAPage;
