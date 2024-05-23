import { Box, ListItem, Text, UnorderedList, Link } from "@chakra-ui/react";

import { InfoTooltip } from "./InfoTooltip";

export default function NatureOrganismeTooltip() {
  return (
    <InfoTooltip
      contentComponent={() => (
        <Box>
          <b>Nature de l’organisme de formation</b>
          <Text as="p">
            La donnée «&nbsp;Nature&nbsp;» est déduite des relations entre les organismes (base des Carif-Oref). Le{" "}
            <Link href="https://catalogue-apprentissage.intercariforef.org/" textDecoration="underLine">
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
            <Link href="https://catalogue-apprentissage.intercariforef.org/" textDecoration="underLine">
              Carif-oref régional
            </Link>
            .
          </Text>
        </Box>
      )}
      aria-label="La donnée Nature est déduite des relations entre les organismes (base des Carif-Oref)"
    />
  );
}
