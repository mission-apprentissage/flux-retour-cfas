import React, { useEffect, useMemo, useRef, useState } from "react";
import { Center, Heading, Spinner, Box, Flex, Text, HStack, Button, VStack, Switch } from "@chakra-ui/react";
import groupBy from "lodash.groupby";
import { useRouter } from "next/router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRecoilValue, useSetRecoilState } from "recoil";
import { usePlausible } from "next-plausible";

import { organismeAtom } from "@/hooks/organismeAtoms";
import { _get, _getBlob } from "@/common/httpClient";
import { hasContextAccessTo } from "@/common/utils/rolesUtils";
import useDownloadClick from "@/hooks/useDownloadClick";
import { DownloadLine } from "@/theme/components/icons";
import { DoubleChevrons } from "@/theme/components/icons/DoubleChevrons";

import EffectifsTable from "../effectifs/engine/EffectifsTable";
import { effectifsStateAtom } from "../effectifs/engine/atoms";
import { Input } from "../effectifs/engine/formEngine/components/Input/Input";

function useOrganismesEffectifs(organismeId) {
  const setCurrentEffectifsState = useSetRecoilState(effectifsStateAtom);
  const queryClient = useQueryClient();
  const prevOrganismeId = useRef(null);

  useEffect(() => {
    if (prevOrganismeId.current !== organismeId) {
      prevOrganismeId.current = organismeId;
      queryClient.resetQueries("organismesEffectifs", { exact: true });
    }
  }, [queryClient, organismeId]);

  const { data, isLoading, isFetching } = useQuery(
    ["organismesEffectifs"],
    async () => {
      const organismesEffectifs = await _get(`/api/v1/organisme/effectifs?organisme_id=${organismeId}&sifa=true`);
      // eslint-disable-next-line no-undef
      const newEffectifsState = new Map();
      for (const { id, validation_errors, requiredSifa } of organismesEffectifs) {
        newEffectifsState.set(id, { validation_errors, requiredSifa });
      }
      setCurrentEffectifsState(newEffectifsState);
      return organismesEffectifs;
    },
    {
      refetchOnWindowFocus: false,
    }
  );

  return { isLoading: isFetching || isLoading, organismesEffectifs: data || [] };
}

const DownloadButton = ({ title, fileName, getFile }) => {
  const { onClick, isLoading } = useDownloadClick(getFile, fileName);
  const plausible = usePlausible();

  return (
    <Button
      size="md"
      onClick={(e) => {
        plausible("telechargement_sifa");
        return onClick(e);
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
  const organisme = useRecoilValue(organismeAtom);
  const { isLoading, organismesEffectifs } = useOrganismesEffectifs(organisme._id);
  const canEdit = hasContextAccessTo(organisme, "organisme/page_effectifs/edition");
  const exportSifaFilename = `tdb-données-sifa-${organisme.nom}-${new Date().toLocaleDateString()}.csv`;

  const [searchValue, setSearchValue] = useState("");

  const organismesEffectifsGroupedBySco = useMemo(
    () => groupBy(organismesEffectifs, "annee_scolaire"),
    [organismesEffectifs]
  );
  const anneScolaire = "2022-2023";
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
          {hasContextAccessTo(organisme, "organisme/page_sifa/telecharger") && (
            <DownloadButton
              fileName={exportSifaFilename}
              getFile={() => _getBlob(`/api/v1/organisme/sifa/export-csv-list?organisme_id=${organisme._id}`)}
              title="Télécharger SIFA"
            />
          )}
          {hasContextAccessTo(organisme, "organisme/page_effectifs/televersement_document") && (
            <>
              <Button
                size="md"
                fontSize={{ base: "sm", md: "md" }}
                p={{ base: 2, md: 4 }}
                h={{ base: 8, md: 10 }}
                onClick={() => {
                  router.push(`${router.asPath.replace("/enquete-SIFA", "/effectifs/televersement")}`);
                }}
                variant="secondary"
              >
                <Text as="span">+ Ajouter</Text>
              </Button>
            </>
          )}
        </HStack>
      </Flex>

      <VStack alignItems="flex-start">
        <Text fontWeight="bold">
          Vous avez {organismesEffectifs.length} effectifs au total, en contrat au 31 décembre{" "}
          {new Date().getFullYear() - 1}. Pour plus de facilité, vous pouvez effectuer une recherche, ou filtrer par
          année.
        </Text>
        <Input
          {...{
            name: "search_effectifs",
            fieldType: "text",
            mask: "C",
            maskBlocks: [
              {
                name: "C",
                mask: "Pattern",
                pattern: "^.*$",
              },
            ],
            placeholder: "Recherche",
          }}
          onSubmit={(value) => {
            setSearchValue(value.trim());
          }}
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
        {Object.entries(organismesEffectifsGroupedBySco).map(([anneSco, orgaE]) => {
          if (anneScolaire !== "all" && anneScolaire !== anneSco) return null;
          const orgaEffectifs = showOnlyMissingSifa ? orgaE.filter((ef) => ef.requiredSifa.length) : orgaE;
          const effectifsByCfd = groupBy(orgaEffectifs, "formation.cfd");
          const borderStyle = { borderColor: "dgalt", borderWidth: 1 }; //anneScolaire === "all" ? { borderColor: "bluefrance", borderWidth: 1 } : {};
          return (
            <Box key={anneSco} mb={5}>
              <Text>
                {anneSco} {!searchValue ? `- ${orgaEffectifs.length} apprenant(es) total` : ""}
              </Text>
              <Box p={4} {...borderStyle}>
                {Object.entries(effectifsByCfd).map(([cfd, effectifs], i) => {
                  const { formation } = effectifs[0];
                  return (
                    <EffectifsTableContainer
                      key={anneSco + cfd}
                      canEdit={canEdit}
                      effectifs={effectifs}
                      formation={formation}
                      searchValue={searchValue}
                      {...{
                        ...(i === 0 ? {} : { mt: 14 }),
                      }}
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
