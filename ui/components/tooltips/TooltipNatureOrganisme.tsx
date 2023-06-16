import { Box, ListItem, Text, Tooltip, UnorderedList, Link } from "@chakra-ui/react";

export default function TooltipNatureOrganisme() {
  return (
    <Tooltip
      background="bluefrance"
      color="white"
      label={
        <Box padding="1w">
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
      }
      aria-label="La donnée Nature est déduite des relations entre les organismes (base des Carif-Oref)"
    >
      <Box
        as="i"
        className="ri-information-line"
        fontSize="epsilon"
        color="grey.500"
        marginLeft="1v"
        verticalAlign="middle"
      />
    </Tooltip>
  );
}
