import { Box, Center, Flex, HStack, Heading, Spinner, Text, Stack, Divider, Button } from "@chakra-ui/react";
import { useQuery } from "@tanstack/react-query";
import React from "react";
import { useRecoilValue } from "recoil";

import { _get } from "@/common/httpClient";
import { DuplicateEffectif } from "@/common/types/duplicatesEffectifs";
import Link from "@/components/Links/Link";
import { organismeAtom } from "@/hooks/organismeAtoms";

import EffectifsDoublonsList from "./EffectifsDoublonsList";

const EffectifsDoublonsPage = ({ isMine }) => {
  const organisme = useRecoilValue<any>(organismeAtom);

  const { data: duplicates, isLoading } = useQuery<any, DuplicateEffectif[]>(
    [`duplicates-effectifs`, organisme?._id],
    () => _get(`/api/v1/organismes/${organisme?._id}/duplicates`)
  );

  if (isLoading) {
    return (
      <Center>
        <Spinner />
      </Center>
    );
  }

  if (!organisme) return null;

  return (
    <Flex flexDir="column" width="100%">
      <Heading textStyle="h2" color="grey.800">
        {isMine ? "Mes effectifs" : "Ses effectifs"}
      </Heading>

      <HStack mb={6}>
        <Link
          href={`/organismes/${organisme?._id}/effectifs`}
          color="bluefrance"
          borderBottom="1px solid"
          mt={4}
          _hover={{ cursor: "pointer", textDecoration: "none", borderBottom: "2px solid" }}
        >
          <Box as="i" className="ri-arrow-left-line" marginRight="1w" />
          Retour au tableau des effectifs
        </Link>
      </HStack>

      <Stack>
        {/* Zone a traiter */}
        <Stack spacing={6}>
          <Text color="grey.800" fontSize="1.1rem" fontWeight="bold" mb={4}>
            {`Vérifier les ${duplicates.length} duplicats d'effectifs pour l'année scolaire en cours`}
          </Text>

          <EffectifsDoublonsList data={duplicates || []} />

          <Flex flexDir="row-reverse">
            <Button mr={6} size="md" variant="primary">
              <Text as="span">Valider</Text>
            </Button>
          </Flex>
        </Stack>

        <Divider mt={6} mb={4} />
      </Stack>
    </Flex>
  );
};

export default EffectifsDoublonsPage;