import React, { useEffect, useRef } from "react";
import { Center, Heading, Spinner, Box, Flex, Text, HStack, Button, Circle } from "@chakra-ui/react";
import { useEspace } from "../../../hooks/useEspace";

import { organismeAtom } from "../../../hooks/organismeAtoms";
import { _get, _getBlob } from "../../../common/httpClient";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRecoilValue, useSetRecoilState } from "recoil";
import { hasContextAccessTo } from "../../../common/utils/rolesUtils";
import useDownloadClick from "../../../hooks/old/useDownloadClick";
import { DownloadLine } from "../../../theme/components/icons";
import { useRouter } from "next/router";
import EffectifsTable from "../effectifs/engine/EffectifsTable";
import { effectifsStateAtom } from "../effectifs/engine/atoms";

function useOrganismesEffectifs() {
  const organisme = useRecoilValue(organismeAtom);
  const setCurrentEffectifsState = useSetRecoilState(effectifsStateAtom);
  const queryClient = useQueryClient();
  const prevOrganismeId = useRef(null);

  useEffect(() => {
    if (prevOrganismeId.current !== organisme._id) {
      prevOrganismeId.current = organisme._id;
      queryClient.resetQueries("organismesEffectifs", { exact: true });
    }
  }, [queryClient, organisme._id]);

  const { data, isLoading, isFetching } = useQuery(
    ["organismesEffectifs"],
    async () => {
      const organismesEffectifs = await _get(`/api/v1/organisme/effectifs?organisme_id=${organisme._id}&sifa=true`);
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
  const [onClick, isLoading] = useDownloadClick(getFile, fileName);

  return (
    <Button size="md" onClick={onClick} variant="secondary">
      {isLoading && <Spinner thickness="4px" speed="0.65s" emptyColor="gray.200" color="blue.500" />}
      {!isLoading && <DownloadLine />}
      <Text as="span" ml={2}>
        {title}
      </Text>
    </Button>
  );
};

const SIFAPage = () => {
  const { isMonOrganismePages, isOrganismePages } = useEspace();
  const { isLoading, organismesEffectifs } = useOrganismesEffectifs();
  const organisme = useRecoilValue(organismeAtom);
  const router = useRouter();
  const canEdit = hasContextAccessTo(organisme, "organisme/page_effectifs/edition");
  const exportSifaFilename = `tdb-données-sifa-${organisme.nom}-${new Date().toLocaleDateString()}.csv`;

  if (isLoading) {
    return (
      <Center>
        <Spinner />
      </Center>
    );
  }

  return (
    <>
      <Heading textStyle="h2" color="grey.800" mt={5} mb={8}>
        {isMonOrganismePages && `Mon Enquete SIFA`}
        {isOrganismePages && `Son Enquete SIFA`}
      </Heading>
      <Flex as="nav" align="center" justify="space-between" wrap="wrap" w="100%" alignItems="flex-start">
        <Box flexBasis={{ base: "auto", md: "auto" }} flexGrow="1">
          <HStack>
            <Text>Grouper par :</Text>
            <Button onClick={() => alert("TODO NOT YET")} variant="badgeSelected">
              par formations
              <Circle size="15px" background="white" color="bluefrance" position="absolute" bottom="18px" right="-5px">
                <Box as="i" className="ri-checkbox-circle-line" fontSize="gamma" />
              </Circle>
            </Button>
            <Button onClick={() => alert("TODO NOT YET")} variant="badge">
              par années scolaire
            </Button>
          </HStack>
          <HStack mt={10}>
            <Text>Voir :</Text>
            <Button onClick={() => alert("TODO NOT YET")} variant="badgeSelected">
              Tous les effectifs
              <Circle size="15px" background="white" color="bluefrance" position="absolute" bottom="18px" right="-5px">
                <Box as="i" className="ri-checkbox-circle-line" fontSize="gamma" />
              </Circle>
            </Button>
            <Button
              onClick={() => alert("TODO NOT YET")}
              variant="badge"
              bg="none"
              borderWidth="1px"
              borderColor="bluefrance"
            >
              Seulement les erreurs
            </Button>
          </HStack>
        </Box>
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
                <DownloadLine transform="rotate(180deg)" />
                <Text as="span" ml={2}>
                  Téléversements
                </Text>
              </Button>
            </>
          )}
        </HStack>
      </Flex>

      <Box mt={10} mb={16}>
        <HStack>
          <Text fontWeight="bold" textDecoration="underline">
            Conseiller en économie sociale familiale
          </Text>
          <Text>[Code diplôme 26033206] - hardcodé TODO</Text>
        </HStack>
        <EffectifsTable canEdit={canEdit} modeSifa organismesEffectifs={organismesEffectifs} />
      </Box>
    </>
  );
};

export default SIFAPage;
