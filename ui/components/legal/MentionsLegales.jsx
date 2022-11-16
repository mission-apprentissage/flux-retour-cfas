import React from "react";
import { Box, Heading, Text } from "@chakra-ui/react";

const MentionsLegales = () => {
  return (
    <Box pt={1} pb={16}>
      <Text>Mentions légales du site « Tableau de bord de l’apprentissage »</Text>
      <Box mt={4}>
        <Heading as={"h3"} textStyle="h6" mb={2}>
          Éditeur du site
        </Heading>
        <Text>
          Ce site est édité par la Délégation Générale à l’Emploi et à la Formation Professionnelle (DGEFP) et la
          Mission interministérielle de l’apprentissage.
          <br />
          <br />
          10-18 place des 5 Martyrs du Lycée Buffon
          <br /> 75015 Paris
        </Text>
      </Box>
      <Box mt={4}>
        <Heading as={"h3"} textStyle="h6" mb={2}>
          Directeur de la publication
        </Heading>
        <Text>
          Le Directeur de la publication est Monsieur Bruno Lucas, Délégué général à l’Emploi et à la Formation
          Professionnelle.
        </Text>
      </Box>
      <Box mt={4}>
        <Heading as={"h3"} textStyle="h6" mb={2}>
          Hébergement du site
        </Heading>
        <Text>
          L’hébergement est assuré par OVH SAS, situé à l’adresse suivante :
          <br />
          2 rue Kellermann
          <br />
          59100 Roubaix
          <br />
          Standard : 09.72.10.07
          <br />
          <br />
          La conception et la réalisation du site sont effectuée par La Mission Interministérielle pour l’Apprentissage,
          située à l’adresse suivante :
          <br />
          Beta.gouv
          <br />
          20 avenue de Ségur
          <br />
          75007 Paris
        </Text>
      </Box>
      <Box mt={4}>
        <Heading as={"h3"} textStyle="h6" mb={2}>
          Accessibilité
        </Heading>
        <Text>
          La conformité aux normes d’accessibilité numérique est un objectif ultérieur mais nous tâchons de rendre ce
          site accessible à toutes et à tous.
        </Text>
      </Box>
      <Box mt={4}>
        <Heading as={"h3"} textStyle="h6" mb={2}>
          Signaler un dysfonctionnement
        </Heading>
        <Text>
          Si vous rencontrez un défaut d’accessibilité vous empêchant d’accéder à un contenu ou une fonctionnalité du
          site, merci de nous en faire part.
          <br />
          Si vous n’obtenez pas de réponse rapide de notre part, vous êtes en droit de faire parvenir vos doléances ou
          une demande de saisine au Défenseur des droits.
        </Text>
      </Box>
    </Box>
  );
};
export default MentionsLegales;
