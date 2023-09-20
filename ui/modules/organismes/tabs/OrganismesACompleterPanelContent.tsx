import { Box, ListItem, Stack, Text, UnorderedList } from "@chakra-ui/react";

import Link from "@/components/Links/Link";
import Ribbons from "@/components/Ribbons/Ribbons";

import { OrganismeNormalized } from "../ListeOrganismesPage";
import OrganismesFilterAndSearchPanel from "../OrganismesFilterAndSearchPanel";
import OrganismesTable from "../OrganismesTable";

function OrganismesACompleterPanelContent({ organismes }: { organismes: OrganismeNormalized[] }) {
  return (
    <Stack spacing="4w">
      <OrganismesFilterAndSearchPanel showFilterNature showFilterTransmission showFilterLocalisation showFilterEtat />

      <Ribbons variant="warning" my={8}>
        <Box color="grey.800">
          <Text>
            Les organismes (OFA) ci-dessous présentent une ou plusieurs anomalies suivantes à <strong>corriger</strong>{" "}
            ou <strong>compléter</strong> :
          </Text>
          <UnorderedList styleType="'- '">
            <ListItem>
              Un couple UAI-SIRET qui n’est pas <strong>validé</strong> dans le{" "}
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
              Un code UAI est répertorié comme <strong>inconnu</strong> ou non <strong>validé</strong> dans le{" "}
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
              L’état administratif du SIRET de l’établissement, tel qu’il est enregistré auprès de l’INSEE, est{" "}
              <strong>fermé</strong>.
            </ListItem>
            <ListItem>
              La nature de l’organisme (déduite des relations entre organismes - base des Carif-Oref) est{" "}
              <strong>inconnue</strong>.
            </ListItem>
          </UnorderedList>

          <Text fontWeight="bold">
            Aidez-nous à fiabiliser ces organismes en menant des actions correctives selon les manquements constatés.
          </Text>
        </Box>
      </Ribbons>
      <OrganismesTable organismes={organismes} modeNonFiable />
    </Stack>
  );
}

export default OrganismesACompleterPanelContent;
