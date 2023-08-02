import { Box, Flex, Grid, GridItem, Heading, HStack, ListItem, Text, UnorderedList } from "@chakra-ui/react";
import React from "react";

import { CONTACT_ADDRESS } from "@/common/constants/product";
import Link from "@/components/Links/Link";
import Section from "@/components/Section/Section";
import Sommaire from "@/components/Sommaire/Sommaire";

const anchors = {
  Finalites: "finalites",
  DonneesACaracterePersonelTraitees: "donnees-a-caractere-personel-traitees",
  BaseJuridiqueDuTraitementDeDonnees: "base-juridique-du-traitement-de-donnees",
  DureeDeConservation: "duree-de-conservation",
  DroitDesPersonnesConcernees: "droit-des-personnes-concernees",
  DestinatairesDesDonnees: "destinataires-des-donnees",
  SecuriteEtConfidentialiteDesDonnees: "securite-et-confidentialite-des-donnees",
  SousTraitants: "sous-traitants",
  Cookies: "cookies",
};

const SommaireData = [
  { anchorTitle: "1", anchorName: "Finalités", anchorLink: "finalites" },
  {
    anchorTitle: "2",
    anchorName: "Données à caractère personnel traitées",
    anchorLink: "donnees-a-caractere-personel-traitees",
  },
  {
    anchorTitle: "3",
    anchorName: "Base juridique du traitement de données",
    anchorLink: "base-juridique-du-traitement-de-donnees",
  },
  {
    anchorTitle: "4",
    anchorName: "Durée de conservation des données",
    anchorLink: "duree-de-conservation",
  },
  { anchorTitle: "5", anchorName: "Droit des personnes concernées", anchorLink: "droit-des-personnes-concernees" },
  { anchorTitle: "6", anchorName: "Destinataires des données", anchorLink: "destinataires-des-donnees" },
  {
    anchorTitle: "7",
    anchorName: "Sous-traitants",
    anchorLink: "sous-traitants",
  },
  {
    anchorTitle: "8",
    anchorName: "Cookies",
    anchorLink: "cookies",
  },
];

const PolitiqueDeConfidentialite = () => {
  return (
    <HStack
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
        <Section pt="0">
          <Text color="grey.400" fontWeight="bold" align="right" float="right">
            Mise à jour : 7 avril 2023
          </Text>
          <Heading as="h1" color="grey.800" mb={5}>
            Protection des données
          </Heading>
          <Heading as="h3" fontSize="beta" mb={2}>
            Traitement des données à caractère personnel
          </Heading>
        </Section>

        <Section>
          <Text>
            Le tableau de bord de l’apprentissage est développé par la Mission interministérielle pour l’apprentissage.
          </Text>
        </Section>

        <Section id={anchors.Finalites}>
          <Heading as={"h3"} fontSize="beta" mb={2}>
            Finalités
          </Heading>
          <Text>
            Nous manipulons des données à caractère personnel pour améliorer la qualité du suivi et du pilotage de
            l’apprentissage par les différents acteurs. Plus précisément, elles visent à :
          </Text>
          <UnorderedList ml="30px !important" mt="1w">
            <ListItem>
              Permettre aux pouvoirs publics de piloter au mieux la politique de l’apprentissage nationalement et
              localement ;
            </ListItem>
            <ListItem>
              Aider ceux qui peuvent agir à accompagner les apprentis en situation de rupture ou sans contrat ;
            </ListItem>
            <ListItem>
              Simplifier la délivrance d’informations par les CFA, en utilisant la donnée pour pré-remplir les enquêtes
              nationales qui leur sont demandées.
            </ListItem>
          </UnorderedList>
        </Section>

        <Section id={anchors.DonneesACaracterePersonelTraitees}>
          <Heading as={"h3"} fontSize="beta" mb={2}>
            Données à caractère personnel traitées
          </Heading>
          <Text>
            Nous traitons les données à caractère personnel et catégories de données à caractère personnel
            suivantes&nbsp;:
          </Text>
          <UnorderedList ml="30px !important" mt="1w">
            <ListItem>
              Données relatives à l’identification du candidat ou jeune (nom, prénom, date de naissance, INE, adresse
              e-mail) ;
            </ListItem>
            <ListItem>Données relatives au représentant légal du jeune (nom, numéro de téléphone) ;</ListItem>
            <ListItem>
              Données relatives aux événements du parcours des apprenants (date de début et de fin du parcours, date de
              début et de fin de contrat, et rupture, organisme de formation et département) ;
            </ListItem>
            <ListItem>Informations relatives au souhait de formation des candidats;</ListItem>
            <ListItem>Données de contact des organismes de formation (adresse e-mail) ;</ListItem>
            <ListItem>Données de contact des entreprises (adresse e-mail).</ListItem>
          </UnorderedList>
        </Section>

        <Section mt={4} id={anchors.BaseJuridiqueDuTraitementDeDonnees}>
          <Heading as={"h3"} fontSize="beta" mb={2}>
            Base juridique du traitement de données
          </Heading>
          <Text>
            Nous sommes autorisés à traiter vos données dans le cadre d’une mission d’intérêt public ou relevant de
            l’exercice de l’autorité publique dont est investi le responsable de traitement au sens de l’article 6-1 e)
            du RPGD. Cette mission est notamment précisée dans la lettre de Mission de la Mission nationale pour
            l’apprentissage du 10 septembre 2019 et décision gouvernementale du 26 novembre 2019.
          </Text>
        </Section>

        <Section mt={4} id={anchors.DureeDeConservation}>
          <Heading as={"h3"} fontSize="beta" mb={2}>
            Durée de conservation des données
          </Heading>
          <Text>
            Nous conservons vos données pour une durée de 2 ans à compter de la dernière modification liée aux
            informations sur un candidat pour réaliser des analyses comparatives d’une année sur l’autre dans le cadre
            de la finalité de pilotage.
          </Text>
        </Section>

        <Section mt={4} id={anchors.DroitDesPersonnesConcernees}>
          <Heading as={"h3"} fontSize="beta" mb={2}>
            Droit des personnes concernées
          </Heading>
          <Text>Vous disposez des droits suivants concernant vos données à caractère personnel :</Text>
          <UnorderedList ml="30px !important" mt="1w">
            <ListItem>Droit d’information et droit d’accès aux données ;</ListItem>
            <ListItem>Droit de rectification et le cas échéant de suppression des données ;</ListItem>
            <ListItem>Droit d’opposition au traitement des données ;</ListItem>
            <ListItem>Droit à la portabilité des données ;</ListItem>
            <ListItem>Droit à la limitation du traitement.</ListItem>
          </UnorderedList>
          <Text mt={4}>
            Pour les exercer, faites-nous parvenir une demande en précisant la date et l’heure précise de la requête –
            ces éléments sont indispensables pour nous permettre de retrouver votre recherche – par voie électronique à
            l’adresse suivante&nbsp;:{" "}
            <Link href={`mailto:${CONTACT_ADDRESS}`} target="_blank" rel="noopener noreferrer" color="bluefrance">
              {CONTACT_ADDRESS}
            </Link>
          </Text>
          <Text mt={4}>
            Par voie postale&nbsp;:
            <br />
            <br />
            Délégation générale à l’emploi et à la formation professionnelle
            <br />
            14 avenue Duquesne
            <br />
            75350 Paris SP 07
          </Text>
          <Text mt={4}>
            En raison de l’obligation de sécurité et de confidentialité dans le traitement des données à caractère
            personnel qui incombe au responsable de traitement, votre demande ne sera traitée que si vous apportez la
            preuve de votre identité.
          </Text>
          <Text mt={4}>
            Pour vous aider dans votre démarche, vous trouverez un modèle de courrier élaboré par la CNIL ici :{" "}
            <Link href="https://www.cnil.fr/fr/modele/courrier/exercer-son-droit-dacces" color="primary">
              https://www.cnil.fr/fr/modele/courrier/exercer-son-droit-dacces
            </Link>
          </Text>
          <Text mt={4}>
            Le responsable de traitement s’engage à répondre dans un délai raisonnable qui ne saurait dépasser 1 mois à
            compter de la réception de votre demande.
          </Text>
          <Text mt={4}>
            Si vous estimez, après avoir contacté la DGEFP, que vos droits ne sont pas respectés ou que le traitement
            n’est pas conforme au Règlement Général sur la Protection des Données, vous pouvez adresser une réclamation
            auprès de la Commission Nationale de l’Informatique et des Libertés (CNIL).
          </Text>
        </Section>

        <Section mt={4} id={anchors.DestinatairesDesDonnees}>
          <Heading as={"h3"} fontSize="beta" mb={2}>
            Destinataires des données
          </Heading>
          <Text>
            Nous nous engageons à ce que les données à caractère personnel soient traitées par les seules personnes
            autorisées à savoir :
          </Text>
          <UnorderedList ml="30px">
            <ListItem>Les membres de l’équipe de la Mission interministérielle pour l’apprentissage ;</ListItem>
            <ListItem>Les agents autorisés des DREETS, dans le cadre de leurs missions de service public ;</ListItem>
            <ListItem>Les organismes de formation.</ListItem>
          </UnorderedList>
        </Section>

        <Section mt={4} id={anchors.SousTraitants}>
          <Heading as={"h3"} fontSize="beta" mb={2}>
            Sous-traitants
          </Heading>
          <Grid gridTemplateRows={{ base: "repeat(8, auto)", md: "repeat(2, auto)" }} gridAutoFlow="column">
            <GridItem border="1px" p={2} bg="grey.200">
              Sous-traitant
            </GridItem>
            <GridItem border="1px" p={2}>
              OVH SAS
            </GridItem>
            <GridItem border="1px" p={2} bg="grey.200">
              Traitement réalisé
            </GridItem>
            <GridItem border="1px" p={2}>
              Hébergement
            </GridItem>
            <GridItem border="1px" p={2} bg="grey.200">
              Pays destinataire
            </GridItem>
            <GridItem border="1px" p={2}>
              France
            </GridItem>
            <GridItem border="1px" p={2} bg="grey.200">
              Garanties
            </GridItem>
            <GridItem border="1px" p={2}>
              <Link color="primary" href="https://www.ovhcloud.com/fr/personal-data-protection">
                https://www.ovhcloud.com/fr/personal-data-protection
              </Link>
            </GridItem>
          </Grid>
        </Section>

        <Section mt={4} id={anchors.Cookies}>
          <Heading as={"h3"} fontSize="beta" mb={2}>
            Cookies
          </Heading>
          <Text>
            Un cookie est un fichier déposé sur votre terminal lors de la visite d’un site. Il a pour but de collecter
            des informations relatives à votre navigation et de vous adresser des services adaptés à votre terminal
            (ordinateur, mobile ou tablette).
          </Text>
          <Text mt={4}>
            Le site du tableau de bord de l’apprentissage ne dépose pas de cookies de mesure d’audience. Néanmoins, nous
            utilisons Plausible qui permet de suivre les tendances d’utilisation de notre site. L’outil ne collecte
            aucune donnée à caractère personnel et ne dépose aucun cookie. Il ne permet ni d’identifier les personnes,
            ni de tracer leur usage d’internet dans ou en dehors du site.
          </Text>
          <Text mt={4}>Pour plus d’informations sur Plausible : </Text>

          <UnorderedList ml="30px !important" mt="1w">
            <ListItem>
              <Link
                color="primary"
                href="https://plausible.io/data-policy#first-thing-first-what-we-collect-and-what-we-use-it-for"
              >
                https://plausible.io/data-policy#first-thing-first-what-we-collect-and-what-we-use-it-for
              </Link>
            </ListItem>
            <ListItem>
              <Link color="primary" href="https://plausible.io/privacy">
                https://plausible.io/privacy
              </Link>
            </ListItem>
            <ListItem>
              <Link color="primary" href="https://plausible.io/data-policy#how-we-count-unique-users-without-cookies">
                https://plausible.io/data-policy#how-we-count-unique-users-without-cookies
              </Link>
            </ListItem>
          </UnorderedList>
        </Section>
      </Box>
    </HStack>
  );
};
export default PolitiqueDeConfidentialite;
