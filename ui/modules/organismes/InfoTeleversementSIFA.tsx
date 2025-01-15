import { Box, Grid, HStack, ListItem, Text, UnorderedList } from "@chakra-ui/react";

export default function InfoTeleversementSIFA() {
  return (
    <>
      <Text mt={4} fontSize="zeta" fontWeight="bold">
        18 variables sont obligatoires pour chaque effectif présent au 31/12 de l’année N :
      </Text>
      <HStack mt={2} fontSize="zeta">
        <Grid templateColumns="repeat(2, 1fr)" gap={6}>
          <Box>
            <UnorderedList>
              <ListItem>le numéro UAI (unité administrative immatriculée) de l’établissement</ListItem>
              <ListItem>le type de CFA</ListItem>
              <ListItem>le numéro UAI du site de formation</ListItem>
              <ListItem>l’UAI de l’EPLE</ListItem>
              <ListItem>la nature de la structure juridique</ListItem>
              <ListItem>le statut du jeune</ListItem>
              <ListItem>le diplôme préparé</ListItem>
              <ListItem>La durée théorique de la formation</ListItem>
              <ListItem>La durée réelle de la formation</ListItem>
            </UnorderedList>
          </Box>
          <Box>
            <UnorderedList>
              <ListItem>le nom du jeune (nom1)</ListItem>
              <ListItem>le prénom du jeune (prénom1)</ListItem>
              <ListItem>l’adresse</ListItem>
              <ListItem>La date de naissance</ListItem>
              <ListItem>le lieu de naissance</ListItem>
              <ListItem>le sexe</ListItem>
              <ListItem>la situation ou classe fréquentée l’année dernière (N-1)</ListItem>
              <ListItem>le numéro UAI de l’établissement fréquenté l’année dernière (N-1)</ListItem>
            </UnorderedList>
          </Box>
        </Grid>
      </HStack>
      <Box mt={4} color="#ef5800">
        <Text fontSize="zeta">
          L&apos;application SIFA permettra d&apos;importer des fichiers qui contiennent soit des codes diplômes soit
          des codes RNCP. Dans un fichier, il ne peut y avoir qu’un seul type de codes.
        </Text>
      </Box>
    </>
  );
}
