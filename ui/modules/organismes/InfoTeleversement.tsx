import { Box, Grid, HStack, ListItem, Text, UnorderedList, VStack } from "@chakra-ui/react";

import ButtonTeleversement from "@/components/buttons/ButtonTeleversement";
import DownloadSimple from "@/theme/components/icons/DownloadSimple";

export default function InfoTeleversement() {
  return (
    <>
      <VStack align="start">
        <ButtonTeleversement href="/modele-import.xlsx">
          Télécharger le modèle Excel
          <DownloadSimple ml="2" />
        </ButtonTeleversement>
        <Box my={4} color="#ef5800">
          <Text fontSize="zeta">Vous pouvez directement remplir le fichier-modèle avec vos effectifs. </Text>
          <Text fontSize="zeta">Veuillez ne pas modifier l’intitulé des colonnes. </Text>
        </Box>
      </VStack>
      <Text mt={6} fontWeight="bold">
        25 données sont obligatoires pour chaque effectif :
      </Text>
      <HStack mt={2} fontSize="zeta">
        <Grid templateColumns="repeat(2, 1fr)" gap={6}>
          <UnorderedList>
            <ListItem>Nom de l’apprenant</ListItem>
            <ListItem>Prénom de l’apprenant</ListItem>
            <ListItem>Date de naissance de l’apprenant</ListItem>
            <ListItem>Email de l’apprenant</ListItem>
            <ListItem>Adresse de résidence de l’apprenant</ListItem>
            <ListItem>Code postal de résidence de l’apprenant</ListItem>
            <ListItem>Genre de l’apprenant</ListItem>
            <ListItem>Date à laquelle le statut de l’apprenant a été saisi</ListItem>
            <ListItem>Statut de l’apprenant</ListItem>
            <ListItem>N° UAI de l’établissement responsable</ListItem>
            <ListItem>SIRET de l’établissement responsable</ListItem>
            <ListItem>N° UAI de l’établissement formateur</ListItem>
          </UnorderedList>

          <UnorderedList>
            <ListItem>SIRET de l’établissement formateur</ListItem>
            <ListItem>N° UAI du lieu de formation</ListItem>
            <ListItem>SIRET du lieu de formation</ListItem>
            <ListItem>Année de formation concernée</ListItem>
            <ListItem>Date d’inscription en formation</ListItem>
            <ListItem>Date d’entrée en formation </ListItem>
            <ListItem>Date de fin de formation</ListItem>
            <ListItem>Durée théorique de la formation</ListItem>
            <ListItem>Code Formation Diplôme (CFD)</ListItem>
            <ListItem>Diplôme de la formation</ListItem>
            <ListItem>Code RNCP de la formation</ListItem>
            <ListItem>SIRET de l’employeur </ListItem>
            <ListItem>Date de rupture du contrat (si pertinent)</ListItem>
          </UnorderedList>
        </Grid>
      </HStack>
    </>
  );
}
