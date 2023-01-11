import React from "react";
import { Box, Flex, Text, HStack, Button, Circle, useDisclosure, Heading } from "@chakra-ui/react";
import { useRecoilValue } from "recoil";

import { DownloadLine } from "../../../../theme/components/icons";
import { hasContextAccessTo } from "../../../../common/utils/rolesUtils";
import { organismeAtom } from "../../../../hooks/organismeAtoms";
import AjoutApprenantModal from "./AjoutApprenantModal";
import { useRouter } from "next/router";
import { useEspace } from "../../../../hooks/useEspace";
import EffectifsTable from "./EffectifsTable";

const Effectifs = ({ organismesEffectifs }) => {
  const router = useRouter();
  const { isMonOrganismePages, isOrganismePages } = useEspace();
  const organisme = useRecoilValue(organismeAtom);
  const ajoutModal = useDisclosure();
  const canEdit = hasContextAccessTo(organisme, "organisme/page_effectifs/edition");

  return (
    <Flex flexDir="column" width="100%" my={10}>
      <Heading textStyle="h2" color="grey.800" mb={5}>
        {isMonOrganismePages && `Mes effectifs`}
        {isOrganismePages && `Ses effectifs`}
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
          {hasContextAccessTo(organisme, "organisme/page_effectifs/telecharger") && (
            <Button size="md" onClick={() => alert("TODO NOT YET")} variant="secondary">
              <DownloadLine />
              <Text as="span" ml={2}>
                Télécharger
              </Text>
            </Button>
          )}

          {hasContextAccessTo(organisme, "organisme/page_effectifs/televersement_document") && (
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
                <DownloadLine transform="rotate(180deg)" />
                <Text as="span" ml={2}>
                  Téléversements
                </Text>
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

      <Box mt={10} mb={16}>
        <HStack>
          <Text fontWeight="bold" textDecoration="underline">
            Conseiller en économie sociale familiale
          </Text>
          <Text>[Code diplôme 26033206] - hardcodé TODO</Text>
        </HStack>
        <EffectifsTable canEdit={canEdit} organismesEffectifs={organismesEffectifs} />
      </Box>
    </Flex>
  );
};

export default Effectifs;
