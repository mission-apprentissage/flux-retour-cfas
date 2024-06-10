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
        20 champs sont obligatoires pour chaque effectif :
      </Text>
      <HStack mt={2} fontSize="zeta">
        <Grid templateColumns="repeat(3, 1fr)" gap={6}>
          <Box>
            <Text mt={6} fontWeight="bold">
              7 champs concernant l’apprenant :
            </Text>
            <UnorderedList>
              <ListItem>Nom de l’apprenant</ListItem>
              <ListItem>Prénom de l’apprenant</ListItem>
              <ListItem>Date de naissance de l’apprenant</ListItem>
              <ListItem>Sexe de l’apprenant</ListItem>
              <ListItem>Email de l’apprenant</ListItem>
              <ListItem>Adresse de résidence de l’apprenant</ListItem>
              <ListItem>Code postal de résidence de l’apprenant</ListItem>
            </UnorderedList>
          </Box>
          <Box>
            <Text mt={6} fontWeight="bold">
              6 champs concernant l’organisme de formation:
            </Text>
            <UnorderedList>
              <ListItem>N° UAI de l’établissement responsable</ListItem>
              <ListItem>SIRET de l’établissement responsable</ListItem>
              <ListItem>N° UAI de l’établissement formateur</ListItem>
              <ListItem>SIRET de l’établissement formateur</ListItem>
              <ListItem>N° UAI du lieu de formation</ListItem>
              <ListItem>SIRET du lieu de formation</ListItem>
            </UnorderedList>
          </Box>
          <Box>
            <Text mt={6} fontWeight="bold">
              7 champs concernant la formation suivie:
            </Text>
            <UnorderedList>
              <ListItem> Année scolaire</ListItem>
              <ListItem>Année de formation concernée</ListItem>
              <ListItem>Code RNCP de la formation</ListItem>
              <ListItem>Date d’inscription en formation</ListItem>
              <ListItem> Date d’entrée en formation</ListItem>
              <ListItem>Date de fin de formation </ListItem>
              <ListItem>Durée théorique de la formation</ListItem>
            </UnorderedList>
          </Box>
        </Grid>
      </HStack>
      <Text mt={6} fontWeight="bold">
        5 champs sont obligatoires seulement dans le cas où ils sont pertinents car ils dépendent du parcours de
        l’effectif (si l’on a un contrat, il faut mettre la date de contrat, par exemple). Sans eux, le statut de
        l’effectif sera erroné.
      </Text>
      <Grid templateColumns="repeat(2, 1fr)" gap={6} fontSize="zeta">
        <Box>
          <Text mt={6} fontWeight="bold">
            7 champs concernant l’apprenant :
          </Text>
          <UnorderedList>
            <ListItem>Date rupture de formation (si pertinent)</ListItem>
            <ListItem>Date de début du ou des contrats (si pertinent)</ListItem>
            <ListItem>Date de fin du ou des contrats (si pertinent)</ListItem>
            <ListItem>SIRET du ou des employeurs (si pertinent)</ListItem>
            <ListItem>Date de rupture du ou des contrats (si pertinent)</ListItem>
          </UnorderedList>
        </Box>
      </Grid>
    </>
  );
}
