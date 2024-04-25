import { Box, ListItem, Stack, Text, UnorderedList } from "@chakra-ui/react";
import { REFERENTIEL_ONISEP, FAQ_REFERENCER_ETABLISSEMENT } from "shared";

import Link from "@/components/Links/Link";
import Ribbons from "@/components/Ribbons/Ribbons";
import { useOrganismesFiltered } from "@/hooks/organismes";

import { OrganismeNormalized } from "../ListeOrganismesPage";
import OrganismesTable from "../OrganismesTable";

function OrganismesACompleterPanelContent({ organismes }: { organismes: OrganismeNormalized[] }) {
  const { organismesFiltered } = useOrganismesFiltered(organismes);

  return (
    <Stack spacing="4w">
      <Ribbons variant="warning" mt={4}>
        <Box color="grey.800">
          <Text>
            Les organismes (OFA) ci-dessous présentent une ou plusieurs anomalies suivantes à <strong>corriger</strong>{" "}
            ou <strong>compléter</strong> :
          </Text>
          <UnorderedList styleType="'- '">
            <ListItem>
              Un couple UAI-SIRET n’est pas <strong>validé</strong> ou un code UAI est répertorié comme{" "}
              <strong>inconnu</strong> ou <strong>non validé</strong> dans le{" "}
              <Link href={REFERENTIEL_ONISEP} isExternal={true} borderBottom="1px" _hover={{ textDecoration: "none" }}>
                Référentiel de l’apprentissage
              </Link>
              .
            </ListItem>
            <ListItem>
              La nature de l’organisme (déduite des relations entre organismes - base des Carif-Oref) est{" "}
              <strong>inconnue</strong>.
            </ListItem>
            <ListItem>
              L’état administratif du SIRET de l’établissement, tel qu’il est enregistré auprès de l’INSEE, est{" "}
              <strong>fermé</strong>.
            </ListItem>
          </UnorderedList>

          <Text fontWeight="bold">
            Aidez-nous à fiabiliser ces organismes en menant des actions correctives selon les manquements constatés.
          </Text>
          <Text fontWeight="bold">
            Pour cela, lisez l’article{" "}
            <Link
              href={FAQ_REFERENCER_ETABLISSEMENT}
              isExternal={true}
              borderBottom="1px"
              _hover={{ textDecoration: "none" }}
            >
              “Comment bien référencer un établissement ?”
            </Link>
          </Text>
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

export default OrganismesACompleterPanelContent;
