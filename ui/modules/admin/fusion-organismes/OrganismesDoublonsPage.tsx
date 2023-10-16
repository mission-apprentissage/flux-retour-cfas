import { Center, Flex, Spinner, Text, Stack } from "@chakra-ui/react";
import React from "react";

import { _get } from "@/common/httpClient";
import { Organisme } from "@/common/internal/Organisme";

import OrganismesDoublonsList from "./OrganismesDoublonsList";

const OrganismesDoublonsPage = ({
  organismesDuplicats = [],
  isLoading = false,
}: {
  organismesDuplicats: Organisme[];
  isLoading: boolean;
}) => {
  if (isLoading) {
    return (
      <Center>
        <Spinner />
      </Center>
    );
  }

  if (!organismesDuplicats) return null;

  return (
    <Flex flexDir="column" width="100%">
      {/* Zone a traiter */}
      <Stack spacing={6}>
        <Text color="grey.800" fontSize="1.1rem" fontWeight="bold" mb={4}>
          {`Vérifier les ${organismesDuplicats.length} duplicats d'organisme`}
        </Text>

        <OrganismesDoublonsList data={organismesDuplicats || []} />
      </Stack>
    </Flex>
  );
};

export default OrganismesDoublonsPage;
