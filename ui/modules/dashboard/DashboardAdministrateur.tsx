import { Grid, GridItem } from "@chakra-ui/react";

import {
  useOrganisationOrganismes,
  useOrganismesDuplicatsLists,
  useOrganismesNormalizedLists,
} from "@/hooks/organismes";

const DashboardAdministrateur = () => {
  const { organismes } = useOrganisationOrganismes();
  const { organismesACompleter } = useOrganismesNormalizedLists(organismes || []);
  const { organismesDuplicats } = useOrganismesDuplicatsLists(organismes || []);

  return (
    <Grid templateRows="repeat(1, 1fr)" templateColumns="repeat(2, 1fr)" gap={4} my={8}>
      <GridItem border="1px" borderColor="grey.400" borderBottom="4px" borderBottomColor="bluefrance" py="6" px="6">
        {organismesACompleter.length} organismes <strong>à fiabiliser</strong>
      </GridItem>
      <GridItem border="1px" borderColor="grey.400" borderBottom="4px" borderBottomColor="bluefrance" py="6" px="6">
        {organismesDuplicats.length} <strong>duplicats d&apos;organismes</strong>
      </GridItem>
    </Grid>
  );
};

export default DashboardAdministrateur;
