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
          <UnorderedList>
            <ListItem>Les organismes responsables</ListItem>
            <ListItem>Les organismes responsables et formateur</ListItem>
            <ListItem>Les organismes formateurs</ListItem>
          </UnorderedList>
          <Text as="p">
            Si la cellule contient «&nbsp;inconnue&nbsp;», cela signifie que l’organisme n’a pas déclaré son offre de
            formation dans la base de son Carif-Oref : Inviter l’organisme à référencer ses formations en apprentissage
            auprès du{" "}
            <Link
              isExternal
              href="https://catalogue-apprentissage.intercariforef.org/"
              textDecoration="underLine"
              display="inline"
            >
              Carif-Oref régional
            </Link>
            .
          </Text>
        </Box>
      )}
      aria-label="La donnée Nature est déduite des relations entre les organismes (base des Carif-Oref)"
    />
  );
}
