import React from "react";
import { Heading, Button, Badge, HStack, Text, useDisclosure, Flex, Box, Spinner } from "@chakra-ui/react";

import { hasContextAccessTo } from "../../../common/utils/rolesUtils";

import { StatusBadge } from "../../../components/StatusBadge/StatusBadge";
import LivePeopleAvatar from "./LivePeopleAvatar";
import { InviteModal } from "./InviteModal";

import { AvatarPlus } from "../../../theme/components/icons";
import { useRecoilValue } from "recoil";
import { autoSaveStatusAtom } from "../formEngine/hooks/useAutoSave";
import { CheckIcon } from "@chakra-ui/icons";

const AutoSaveBadge = () => {
  const status = useRecoilValue(autoSaveStatusAtom);
  return (
    <Badge variant="solid" bg="grey.100" color="grey.500" textStyle="sm" px="15px" ml="10px">
      {status === "OK" && (
        <Text as="i" display="flex" alignItems="center">
          Sauvegarde automatique activée <CheckIcon w="10px" h="10px" ml="2" color="grey" />
        </Text>
      )}
      {status === "PENDING" && (
        <Text as="i">
          {" "}
          <Text as="i" display="flex" alignItems="center">
            Sauvegarde en cours <Spinner w="10px" h="10px" ml="2" />
          </Text>
        </Text>
      )}
      {status === "ERROR" && <Text as="i">Non sauvegardé</Text>}
    </Badge>
  );
};

const DossierHeader = ({ dossier }) => {
  const inviteModal = useDisclosure();
  return (
    <Flex mt={6} flexDirection="column">
      <HStack w="full">
        <Heading as="h1" flexGrow="1">
          {dossier?.nom}
          <StatusBadge status={dossier?.etat} ml={5} />
          <AutoSaveBadge />
        </Heading>
        <HStack>
          <LivePeopleAvatar />
          {hasContextAccessTo(dossier, "dossier/page_parametres/gestion_acces") && (
            <>
              <Button size="md" onClick={inviteModal.onOpen} variant="secondary">
                <AvatarPlus />
                <Text as="span" ml={2}>
                  Partager
                </Text>
              </Button>
              <InviteModal
                title="Partager le dossier"
                size="md"
                isOpen={inviteModal.isOpen}
                onClose={inviteModal.onClose}
              />
            </>
          )}
        </HStack>
      </HStack>
      <Box>
        <Text color="mgalt" as="i" fontSize="0.9rem">
          Numéro de télétransmission : {dossier?._id}
        </Text>
      </Box>
    </Flex>
  );
};
export default DossierHeader;
