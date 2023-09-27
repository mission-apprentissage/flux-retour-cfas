import { Center, Heading, Spinner, Box, Flex, Text, HStack, Button, VStack, Switch } from "@chakra-ui/react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import groupBy from "lodash.groupby";
import { useRouter } from "next/router";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRecoilValue, useSetRecoilState } from "recoil";
import { getAnneesScolaireListFromDate } from "shared";

import { _get, _getBlob } from "@/common/httpClient";
import { organismeAtom } from "@/hooks/organismeAtoms";
import { usePlausibleTracking } from "@/hooks/plausible";
import useDownloadClick from "@/hooks/useDownloadClick";
import { effectifsStateAtom } from "@/modules/mon-espace/effectifs/engine/atoms";
import EffectifsTable from "@/modules/mon-espace/effectifs/engine/EffectifsTable";
import { Input } from "@/modules/mon-espace/effectifs/engine/formEngine/components/Input/Input";
import { DownloadLine } from "@/theme/components/icons";
import { DoubleChevrons } from "@/theme/components/icons/DoubleChevrons";

const currentAnneeScolaireYear = getAnneesScolaireListFromDate(new Date())[1].substring(0, 4);

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

const DownloadButton = ({ title, fileName, getFile }) => {
  const { onClick, isLoading } = useDownloadClick(getFile, fileName);
  const { trackPlausibleEvent } = usePlausibleTracking();

  return (
    <Button
      size="md"
      onClick={(_e) => {
        trackPlausibleEvent("telechargement_sifa");
        return onClick();
      }}
      variant="secondary"
    >
      {isLoading && <Spinner thickness="4px" speed="0.65s" emptyColor="gray.200" color="blue.500" />}
      {!isLoading && <DownloadLine />}
      <Text as="span" ml={2}>
        {title}
      </Text>
    </Button>
  );
};

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

const SIFAPage = ({ isMine }) => {
  const router = useRouter();
  const organisme = useRecoilValue<any>(organismeAtom);
  const { isLoading, organismesEffectifs } = useOrganismesEffectifs(organisme._id);
  const exportSifaFilename = `tdb-données-sifa-${
    organisme.enseigne ?? organisme.raison_sociale
  }-${new Date().toLocaleDateString()}.csv`;

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
  // historique_statut.date_statut <= "31/12/202"
  return (
    <Flex flexDir="column" width="100%" my={10}>
      <Flex as="nav" align="center" justify="space-between" wrap="wrap" w="100%" alignItems="flex-start">
        <Heading textStyle="h2" color="grey.800" mt={5} mb={8}>
          {isMine ? "Mon Enquête SIFA" : "Son Enquête SIFA"}
        </Heading>
        <HStack spacing={4}>
          <DownloadButton
            fileName={exportSifaFilename}
            getFile={() => _getBlob(`/api/v1/organismes/${organisme._id}/sifa-export`)}
            title="Télécharger SIFA"
          />
          <Button
            size="md"
            fontSize={{ base: "sm", md: "md" }}
            p={{ base: 2, md: 4 }}
            h={{ base: 8, md: 10 }}
            onClick={() => {
              router.push(`${router.asPath.replace("/enquete-sifa", "/effectifs/televersement")}`);
            }}
            variant="secondary"
          >
            <Text as="span">+ Ajouter</Text>
          </Button>
        </HStack>
      </Flex>

      <VStack alignItems="flex-start">
        <Text fontWeight="bold">
          Vous avez {organismesEffectifs.length} effectifs au total, en contrat au 31 décembre{" "}
          {currentAnneeScolaireYear}, sur l&apos;année scolaire {getAnneesScolaireListFromDate(new Date()).join(", ")}.
          Pour plus de facilité, vous pouvez effectuer une recherche, ou filtrer par année.
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
    </Flex>
  );
};

export default SIFAPage;
