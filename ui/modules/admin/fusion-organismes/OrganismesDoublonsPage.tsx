import { Center, Flex, Spinner, Heading, Stack } from "@chakra-ui/react";
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
      <Stack spacing={1}>
        <Heading as="h6" variant="h1" color="grey.800" fontWeight="bold" fontSize="gamma">
          {`Vérifier les ${organismesDuplicats.length} duplicats d'organisme`}
        </Heading>
        <OrganismesDoublonsList data={organismesDuplicats || []} />
      </Stack>
    </Flex>
  );
};

export default OrganismesDoublonsPage;
