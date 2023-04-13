import React from "react";
import { Heading, Badge, HStack, Text, Flex, Box, Spinner } from "@chakra-ui/react";

import { StatusBadge } from "../../../components/StatusBadge/StatusBadge";
import LivePeopleAvatar from "./LivePeopleAvatar";

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
