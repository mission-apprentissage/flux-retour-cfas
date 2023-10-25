import { Box, Stack, Text } from "@chakra-ui/react";

import Ribbons from "@/components/Ribbons/Ribbons";
import { useOrganismesFiltered } from "@/hooks/organismes";

import { OrganismeNormalized } from "../ListeOrganismesPage";
import OrganismesTable from "../OrganismesTable";

function OrganismesFermesSansTransmissionOuInconnusPanelContent({ organismes }: { organismes: OrganismeNormalized[] }) {
  const { organismesFiltered } = useOrganismesFiltered(organismes);

  return (
    <Stack spacing="4w">
      <Ribbons variant="warning" mt={4}>
        <Box color="grey.800">
          <Text>Les organismes (OFA) ci-dessous sont fermés et ne transmettent pas ou inconnus</Text>
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

export default OrganismesFermesSansTransmissionOuInconnusPanelContent;
