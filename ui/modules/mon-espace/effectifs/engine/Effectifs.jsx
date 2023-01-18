import React, { useState } from "react";
import { useRouter } from "next/router";
import {
  Box,
  Flex,
  Text,
  HStack,
  Button,
  useDisclosure,
  Heading,
  Spinner,
  VStack,
  Circle,
  Switch,
} from "@chakra-ui/react";
import { useRecoilValue } from "recoil";
import groupBy from "lodash.groupby";

import { DownloadLine } from "../../../../theme/components/icons";
import { hasContextAccessTo } from "../../../../common/utils/rolesUtils";
import { organismeAtom } from "../../../../hooks/organismeAtoms";
import AjoutApprenantModal from "./AjoutApprenantModal";
import { useEspace } from "../../../../hooks/useEspace";
import EffectifsTable from "./EffectifsTable";
import useDownloadClick from "../../../../hooks/old/useDownloadClick";
import { _getBlob } from "../../../../common/httpClient";
import { Input } from "./formEngine/components/Input/Input";
import { useMemo } from "react";
import { DoubleChevrons } from "../../../../theme/components/icons/DoubleChevrons";
import Ribbons from "../../../../components/Ribbons/Ribbons";

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

const BadgeButton = ({ onClick, active = false, children, ...props }) => {
  return (
    <Button onClick={onClick} variant={active ? "badgeSelected" : "badge"} {...props}>
      {children}
      {active && (
        <Circle size="15px" background="white" color="bluefrance" position="absolute" bottom="18px" right="-5px">
          <Box as="i" className="ri-checkbox-circle-line" fontSize="gamma" />
        </Circle>
      )}
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
      />
    </Box>
  );
};

const Effectifs = ({ organismesEffectifs }) => {
  const router = useRouter();
  const { isMonOrganismePages, isOrganismePages } = useEspace();
  const organisme = useRecoilValue(organismeAtom);
  const ajoutModal = useDisclosure();
  const canEdit = hasContextAccessTo(organisme, "organisme/page_effectifs/edition");
  const exportFilename = `tdb-données-${organisme.nom}-${new Date().toLocaleDateString()}.csv`;
  const [searchValue, setSearchValue] = useState("");

  const organismesEffectifsGroupedBySco = useMemo(
    () => groupBy(organismesEffectifs, "annee_scolaire"),
    [organismesEffectifs]
  );
  const [anneScolaire, setAnneScolaire] = useState("all");
  const [showOnlyErrors, setShowOnlyErrors] = useState(false);

  return (
    <Flex flexDir="column" width="100%" my={10}>
      <Flex as="nav" align="center" justify="space-between" wrap="wrap" w="100%" alignItems="flex-start">
        <Heading textStyle="h2" color="grey.800" mb={5}>
          {isMonOrganismePages && `Mes effectifs`}
          {isOrganismePages && `Ses effectifs`}
        </Heading>
        <HStack spacing={4}>
          {organismesEffectifs.length > 0 && hasContextAccessTo(organisme, "organisme/page_effectifs/telecharger") && (
            <DownloadButton
              fileName={exportFilename}
              getFile={() => _getBlob(`/api/v1/indicateurs-export?organisme_id=${organisme._id}&date=${Date.now()}`)}
              title="Télécharger rapport"
            />
          )}

          {!(organisme.mode_de_transmission === "API" && organismesEffectifs.length === 0) &&
            hasContextAccessTo(organisme, "organisme/page_effectifs/televersement_document") && (
              <>
                <Button
                  size="md"
                  fontSize={{ base: "sm", md: "md" }}
                  p={{ base: 2, md: 4 }}
                  h={{ base: 8, md: 10 }}
                  onClick={() => {
                    router.push(`${router.asPath}/televersement`);
                  }}
                  variant="secondary"
                >
                  <Text as="span">+ Ajouter</Text>
                </Button>
              </>
            )}
          {hasContextAccessTo(organisme, "organisme/page_effectifs/ajout_apprenant") &&
            organisme.mode_de_transmission !== "API" && (
              <>
                {/* TODO TMP <Button
                  size="md"
                  fontSize={{ base: "sm", md: "md" }}
                  p={{ base: 2, md: 4 }}
                  h={{ base: 8, md: 10 }}
                  onClick={ajoutModal.onOpen}
                  variant="primary"
                >
                  + Nouvelle·au apprenant(e)
                </Button> */}
                <AjoutApprenantModal size="md" isOpen={ajoutModal.isOpen} onClose={ajoutModal.onClose} />
              </>
            )}
        </HStack>
      </Flex>

      {organisme.mode_de_transmission === "MANUEL" && organismesEffectifs.length === 0 && (
        <Ribbons variant="info" mt={5}>
          <Box ml={3}>
            <Text color="grey.800" fontSize="1.1rem" fontWeight="bold">
              {isMonOrganismePages && `Vous n'avez pas encore ajouté d'effectifs`}
              {isOrganismePages && `Aucuns effectifs n'ont encore été ajoutés pour cet organisme.`}
            </Text>
            <Text color="grey.800" mt={4} textStyle="sm">
              Vous pouvez ajouter des effectifs à l&rsquo;aide du bouton ci-dessus.
              <br />
            </Text>
          </Box>
        </Ribbons>
      )}
      {organisme.mode_de_transmission === "API" && organismesEffectifs.length === 0 && (
        <Ribbons variant="info" mt={5}>
          <Box ml={3}>
            <Text color="grey.800" fontSize="1.1rem" fontWeight="bold">
              Aucuns effectifs n&rsquo;ont encore été reçus depuis votre ERP.
            </Text>
            <Text color="grey.800" mt={4} textStyle="sm">
              Merci de revenir ultérieurement. Si vous venez de configurer votre ERP, la transmission de vos effectifs
              sera active demain matin.
              <br />
            </Text>
          </Box>
        </Ribbons>
      )}
      {organismesEffectifs.length > 0 && (
        <>
          <VStack alignItems="flex-start">
            <Text fontWeight="bold">
              Vous avez [{organismesEffectifs.length}] effectifs au total, pour plus de facilité veuillez sélectionner
              une option ci-dessous :
            </Text>
            <Input
              {...{
                name: `search_effectifs`,
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
                  onChange={(e) => {
                    setShowOnlyErrors(e.target.checked);
                  }}
                />
                <Text flexGrow={1}>Afficher uniquement les données en erreur</Text>
              </HStack>
            </HStack>
            <HStack w="full" mt={2}>
              <Text>Par année scolaire</Text>
              <BadgeButton onClick={() => setAnneScolaire("all")} active={anneScolaire === "all"}>
                Toutes
              </BadgeButton>
              {Object.keys(organismesEffectifsGroupedBySco).map((anneSco) => {
                return (
                  <BadgeButton onClick={() => setAnneScolaire(anneSco)} key={anneSco} active={anneScolaire === anneSco}>
                    {anneSco}
                  </BadgeButton>
                );
              })}
            </HStack>
          </VStack>
        </>
      )}

      <Box mt={10} mb={16}>
        {Object.entries(organismesEffectifsGroupedBySco).map(([anneSco, orgaE]) => {
          if (anneScolaire !== "all" && anneScolaire !== anneSco) return null;
          const orgaEffectifs = showOnlyErrors ? orgaE.filter((ef) => ef.validation_errors.length) : orgaE;
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

export default Effectifs;
