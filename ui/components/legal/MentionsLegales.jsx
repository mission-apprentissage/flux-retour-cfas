import React from "react";
import { Box, Flex, Heading, HStack, Link, Text } from "@chakra-ui/react";
import Section from "../Section/Section.jsx";
import { NAVIGATION_PAGES } from "../../common/constants/navigationPages.js";
import Sommaire from "../Sommaire/Sommaire.jsx";

const MentionsLegales = () => {
  const currentPage = NAVIGATION_PAGES.MentionsLegales;

  const SommaireData = [
    { anchorTitle: "1", anchorName: "Éditeur du site", anchorLink: "editeur-du-site" },
    { anchorTitle: "2", anchorName: "Directeur de la publication", anchorLink: "directeur-de-la-publication" },
    { anchorTitle: "3", anchorName: "Hébergement du site", anchorLink: "hebergement-du-site" },
    {
      anchorTitle: "4",
      anchorName: "Accessibilité",
      anchorLink: "accessibilite",
    },
    { anchorTitle: "5", anchorName: "Signaler un dysfonctionnement", anchorLink: "signaler-un-dyfonctionnement" },
  ];

  return (
    <HStack
      mt="4w"
      spacing={["0", "0", "0", "6w"]}
      flexDirection={["column", "column", "column", "row"]}
      alignItems={["normal", "normal", "normal", "center"]}
    >
      <Sommaire>
        <Flex flexDirection="column" fontSize="zeta">
          {SommaireData.map((item) => (
            <Link
              key={item.anchorName}
              padding="1w"
              href={`#${item.anchorLink}`}
              _hover={{ textDecoration: "none", bg: "grey.200" }}
            >
              <Text>
                <Text as="span" fontWeight="700">
                  {item.anchorTitle}.
                </Text>{" "}
                {item.anchorName}
              </Text>
            </Link>
          ))}
        </Flex>
      </Sommaire>
      <Box>
        <Section pt={0}>
          <Heading textStyle="h2" color="grey.800" mt={5}>
            Mentions légales
          </Heading>
          <Text>Mentions légales du site « Tableau de bord de l’apprentissage »</Text>
        </Section>
        <Section mt={4} id={currentPage.anchors.EditeurDuSite}>
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
        </Section>
        <Section mt={4} id={currentPage.anchors.DirecteurDeLaPublication}>
          <Heading as={"h3"} textStyle="h6" mb={2}>
            Directeur de la publication
          </Heading>
          <Text>
            Le Directeur de la publication est Monsieur Bruno Lucas, Délégué général à l’Emploi et à la Formation
            Professionnelle.
          </Text>
        </Section>
        <Section mt={4} id={currentPage.anchors.HebergementDuSite}>
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
            La conception et la réalisation du site sont effectuée par La Mission Interministérielle pour
            l’Apprentissage, située à l’adresse suivante :
            <br />
            Beta.gouv
            <br />
            20 avenue de Ségur
            <br />
            75007 Paris
          </Text>
        </Section>
        <Section mt={4} id={currentPage.anchors.Accessibilite}>
          <Heading as={"h3"} textStyle="h6" mb={2}>
            Accessibilité
          </Heading>
          <Text>
            La conformité aux normes d’accessibilité numérique est un objectif ultérieur mais nous tâchons de rendre ce
            site accessible à toutes et à tous.
          </Text>
        </Section>
        <Section mt={4} id={currentPage.anchors.SignalerUnDyfonctionnement}>
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
        </Section>
      </Box>
    </HStack>
  );
};
export default MentionsLegales;
