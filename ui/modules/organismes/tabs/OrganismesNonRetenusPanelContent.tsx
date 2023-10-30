import { Box, ListItem, Stack, Text, UnorderedList } from "@chakra-ui/react";

import Ribbons from "@/components/Ribbons/Ribbons";
import { useOrganismesFiltered } from "@/hooks/organismes";

import { OrganismeNormalized } from "../ListeOrganismesPage";
import OrganismesTable from "../OrganismesTable";

function OrganismesNonRetenusPanelContent({ organismes }: { organismes: OrganismeNormalized[] }) {
  const { organismesFiltered } = useOrganismesFiltered(organismes);

  return (
    <Stack spacing="4w">
      <Ribbons variant="warning" mt={4}>
        <Box color="grey.800">
          <Text>Veuillez noter que les organismes (OFA) mentionnés ci-dessous sont :</Text>
          <UnorderedList styleType="'- '">
            <ListItem>soit fermés et n&apos;ont pas transmis d&apos;effectifs.</ListItem>
            <ListItem>soit leur nom ou raison sociale n&apos;a pas été reconnu.</ListItem>
          </UnorderedList>
        </Box>
      </Ribbons>

      <OrganismesTable
        organismes={organismesFiltered || []}
        modeNonFiable
        showFilterNature
        showFilterTransmission
        showFilterLocalisation
        showFilterEtat
        showFilterUai
      />
    </Stack>
  );
}

export default OrganismesNonRetenusPanelContent;
