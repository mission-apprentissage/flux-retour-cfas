import { Box, ListItem, Text, UnorderedList, Link } from "@chakra-ui/react";

import { InfoTooltip } from "./InfoTooltip";

export default function NatureOrganismeTooltip() {
  return (
    <InfoTooltip
      headerComponent={() => "Nature de l’organisme de formation"}
      contentComponent={() => (
        <Box>
          <Text as="p">
            La donnée «&nbsp;Nature&nbsp;» est déduite des relations entre les organismes (base des Carif-Oref). Le{" "}
            <Link
              isExternal
              href="https://catalogue-apprentissage.intercariforef.org/"
              textDecoration="underLine"
              display="inline"
            >
              Catalogue
            </Link>{" "}
            des formations en apprentissage identifie trois natures :
          </Text>
          <UnorderedList my={3}>
            <ListItem>Les organismes responsables</ListItem>
            <ListItem>Les organismes responsables et formateur</ListItem>
            <ListItem>Les organismes formateurs</ListItem>
          </UnorderedList>
          <Text as="p">
            Une nature “inconnue” signifie que l’organisme n’a pas déclaré (ou de manière incomplète) son offre de
            formation dans la base de son Carif-Oref : l’organisme doit référencer ses formations en apprentissage
            auprès du{" "}
            <Link
              isExternal
              href="https://www.intercariforef.org/referencer-son-offre-de-formation"
              textDecoration="underLine"
              display="inline"
            >
              Carif-Oref régional{" "}
            </Link>{" "}
            ou se rapprocher du{" "}
            <Link
              isExternal
              href="http://localhost:3000/pdf/Carif-Oref-contacts.pdf"
              textDecoration="underLine"
              display="inline"
            >
              service dédié aux formations
            </Link>
            .
          </Text>
        </Box>
      )}
      aria-label="La donnée Nature est déduite des relations entre les organismes (base des Carif-Oref)"
    />
  );
}
