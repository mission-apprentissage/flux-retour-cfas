import { Box, Grid, GridItem, HStack, Text } from "@chakra-ui/react";

import Link from "@/components/Links/Link";
import {
  useOrganisationOrganismes,
  useOrganismesDuplicatsLists,
  useOrganismesNormalizedLists,
} from "@/hooks/organismes";

const DashboardAdministrateur = () => {
  const { organismes } = useOrganisationOrganismes();
  const { organismesACompleter } = useOrganismesNormalizedLists(organismes || []);
  const { organismesDuplicats } = useOrganismesDuplicatsLists();

  return (
    <Grid templateRows="repeat(1, 1fr)" templateColumns="repeat(2, 1fr)" gap={4} my={8}>
      <GridItem>
        <Link
          border="1px"
          borderColor="grey.400"
          borderBottom="4px"
          borderBottomColor="bluefrance"
          py="6"
          px="6"
          variant="link"
          href="/organismes/a-completer"
          w="95%"
        >
          <HStack>
            <Box as="i" className="ri-alert-fill" color="warning" mt="0.5px" />
            <Text color="black">
              {organismesACompleter.length} organismes <strong> à fiabiliser</strong>
            </Text>
          </HStack>
        </Link>
      </GridItem>

      <GridItem>
        <Link
          border="1px"
          borderColor="grey.400"
          borderBottom="4px"
          borderBottomColor="bluefrance"
          py="6"
          px="6"
          variant="link"
          href="/admin/fusion-organismes"
          w="95%"
        >
          <HStack>
            <Box as="i" className="ri-alert-fill" color="warning" mt="0.5px" />
            <Text color="black">
              {organismesDuplicats?.length || 0} <strong>duplicats d&apos;organismes</strong>
            </Text>
          </HStack>
        </Link>
      </GridItem>
    </Grid>
  );
};

export default DashboardAdministrateur;
