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
import groupBy from "lodash.groupby";
import { useRouter } from "next/router";
import React, { useState, useMemo } from "react";
import { useRecoilValue } from "recoil";

import { _getBlob } from "@/common/httpClient";
import Ribbons from "@/components/Ribbons/Ribbons";
import { organismeAtom } from "@/hooks/organismeAtoms";
import useDownloadClick from "@/hooks/useDownloadClick";
import { DownloadLine } from "@/theme/components/icons";
import { DoubleChevrons } from "@/theme/components/icons/DoubleChevrons";

import AjoutApprenantModal from "./AjoutApprenantModal";
import EffectifsTable from "./EffectifsTable";
import { Input } from "./formEngine/components/Input/Input";

const DownloadButton = ({ title, fileName, getFile }) => {
  const { onClick, isLoading } = useDownloadClick(getFile, fileName);

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

const Effectifs = ({ organismesEffectifs, nbDuplicates, isMine }) => {
  const router = useRouter();
  const organisme = useRecoilValue<any>(organismeAtom);
  const ajoutModal = useDisclosure();
  const exportFilename = `tdb-données-${organisme?.nom || ""}-${new Date().toLocaleDateString()}.csv`;
  const [searchValue, setSearchValue] = useState("");

  const organismesEffectifsGroupedBySco = useMemo(
    () => groupBy(organismesEffectifs, "annee_scolaire"),
    [organismesEffectifs]
  );
  const [anneScolaire, setAnneScolaire] = useState("all");
  const [showOnlyErrors, setShowOnlyErrors] = useState(false);

  if (!organisme) {
    return <></>;
  }
  return (
    <Flex flexDir="column" width="100%">
      <Flex as="nav" align="center" justify="space-between" wrap="wrap" w="100%" alignItems="flex-start">
        <Heading textStyle="h2" color="grey.800" mb={5}>
          {isMine ? "Mes effectifs" : "Ses effectifs"}
        </Heading>
        <HStack spacing={4}>
          {organismesEffectifs.length > 0 && (
            <DownloadButton
              fileName={exportFilename}
              getFile={() => _getBlob(`/api/v1/indicateurs-export?organisme_id=${organisme._id}&date=${Date.now()}`)}
              title="Télécharger rapport"
            />
          )}

          <Button
            size="md"
            variant="secondary"
            onClick={() => {
              router.push(`${router.asPath}/televersement`);
            }}
          >
            <Text as="span">+ Ajouter via fichier Excel</Text>
          </Button>

          {organisme.mode_de_transmission !== "API" && (
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

      <Ribbons variant="info" mb={6}>
        <Text color="grey.800" fontSize="1.1rem" fontWeight="bold">
          Service d’import de vos effectifs en version bêta.
        </Text>
        <Text color="grey.800" mt={4} textStyle="sm">
          Nous listons actuellement toutes les informations qui peuvent empêcher l{"'"}import de fichier afin de
          permettre par la suite une meilleure prise en charge de tout type de fichier.
        </Text>
      </Ribbons>

      {nbDuplicates > 0 && (
        <Ribbons variant="alert" mb={6}>
          <Box ml={3}>
            <Text color="grey.800" fontSize="1.1rem" fontWeight="bold" mr={6} mb={4}>
              Nous avons détécté {nbDuplicates} duplicat{nbDuplicates > 1 ? "s" : ""} pour l{"'"}année scolaire en
              cours.
            </Text>

            <Button
              size="md"
              variant="secondary"
              onClick={() => {
                router.push(`${router.asPath}/doublons`);
              }}
            >
              <Text as="span">Vérifier</Text>
            </Button>
          </Box>
        </Ribbons>
      )}

      {organisme.mode_de_transmission === "MANUEL" && organismesEffectifs.length === 0 && (
        <Ribbons variant="info" mt={5}>
          <Text color="grey.800" fontSize="1.1rem" fontWeight="bold">
            {isMine
              ? `Vous n'avez pas encore ajouté d'effectifs`
              : `Aucun effectif n'a été transmis pour cet organisme.`}
          </Text>
          <Text color="grey.800" mt={4} textStyle="sm">
            Vous pouvez ajouter des effectifs à l&rsquo;aide du bouton &quot;Ajouter&quot; ci-dessus.
            <br />
          </Text>
        </Ribbons>
      )}
      {organisme.mode_de_transmission === "API" && organismesEffectifs.length === 0 && (
        <Ribbons variant="info" mt={5}>
          <Text color="grey.800" fontSize="1.1rem" fontWeight="bold">
            Aucun effectif n&rsquo;a été transmis depuis votre ERP.
          </Text>
          <Text color="grey.800" mt={4} textStyle="sm">
            Merci de revenir ultérieurement. Si vous venez de configurer votre ERP, la transmission de vos effectifs
            sera active demain matin.
            <br />
          </Text>
        </Ribbons>
      )}
      {organismesEffectifs.length > 0 && (
        <>
          <VStack alignItems="flex-start">
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
                placeholder: "Rechercher un apprenant...",
                value: searchValue,
                onSubmit: (value) => {
                  setSearchValue(value.trim());
                },
              }}
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
        {Object.entries<any[]>(organismesEffectifsGroupedBySco).map(([anneSco, orgaE]) => {
          if (anneScolaire !== "all" && anneScolaire !== anneSco) return null;
          const orgaEffectifs = showOnlyErrors ? orgaE.filter((ef) => ef.validation_errors.length) : orgaE;
          const effectifsByCfd: { [cfd: string]: any[] } = groupBy(orgaEffectifs, "formation.cfd");
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
                      canEdit={true} // FIXME organisation liée à l'organisme uniquement ?
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
