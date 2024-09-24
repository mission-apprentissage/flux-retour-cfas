import { Box, ListItem, Stack, Text, UnorderedList } from "@chakra-ui/react";

import Link from "@/components/Links/Link";
import Ribbons from "@/components/Ribbons/Ribbons";
import { useOrganismesFiltered } from "@/hooks/organismes";

import { OrganismeNormalized } from "../ListeOrganismesPage";
import OrganismesTable from "../OrganismesTable";

function OrganismesFiablesPanelContent({ organismes }: { organismes: OrganismeNormalized[] }) {
  const { organismesFiltered } = useOrganismesFiltered(organismes);

  return (
    <Stack spacing="4w">
      <Ribbons variant="info" mt={4}>
        <Box color="grey.800">
          <Text>Est considéré comme fiable un organisme (OFA)&nbsp;:</Text>
          <UnorderedList styleType="'- '">
            <ListItem>
              qui correspond à un couple UAI-SIRET <strong>validé</strong> dans le{" "}
              <Link
                href="https://referentiel.apprentissage.onisep.fr/"
                isExternal={true}
                borderBottom="1px"
                _hover={{ textDecoration: "none" }}
              >
                Référentiel de l’apprentissage
              </Link>
              .
            </ListItem>
            <ListItem>
              dont l’état administratif du SIRET de l’établissement, tel qu’il est renseigné sur l’INSEE, est{" "}
              <strong>en activité</strong>.
            </ListItem>
          </UnorderedList>
        </Box>
      </Ribbons>

      <OrganismesTable
        organismes={organismesFiltered || []}
        showFilterNature
        showFilterTransmission
        showFilterQualiopi
        showFilterPrepaApprentissage
        showFilterLocalisation
      />
    </Stack>
  );
}

export default OrganismesFiablesPanelContent;
