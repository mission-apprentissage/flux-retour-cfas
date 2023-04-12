import React from "react";
import { Box, Flex, Heading, HStack, ListItem, Text, UnorderedList } from "@chakra-ui/react";
import Link from "../Links/Link";
import Sommaire from "../Sommaire/Sommaire.jsx";
import Section from "../Section/Section.jsx";
import { CONTACT_ADDRESS } from "../../common/constants/product";

const anchors = {
  Finalite: "finalite",
  DonneesACaracterePersonelTraitees: "donnees-a-caractere-personel-traitees",
  BaseJuridiqueDuTraitementDeDonnees: "base-juridique-du-traitement-de-donnees",
  DureeDeConservation: "duree-de-conservation",
  DroitDesPersonnesConcernees: "droit-des-personnes-concernees",
  DestinatairesDesDonnees: "destinataires-des-donnees",
  SecuriteEtConfidentialiteDesDonnees: "securite-et-confidentialite-des-donnees",
};

const SommaireData = [
  { anchorTitle: "1", anchorName: "Finalité", anchorLink: "finalite" },
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
    anchorName: "Durée de conservation",
    anchorLink: "duree-de-conservation",
  },
  { anchorTitle: "5", anchorName: "Droit des personnes concernées", anchorLink: "droit-des-personnes-concernees" },
  { anchorTitle: "6", anchorName: "Destinataires des données", anchorLink: "destinataires-des-donnees" },
  {
    anchorTitle: "7",
    anchorName: "Sécurité et confidentialité des données",
    anchorLink: "securite-et-confidentialite-des-donnees",
  },
];

const PolitiqueDeConfidentialite = () => {
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
        <Section pt="0">
          <Heading textStyle="h2" color="grey.800" mt={5}>
            Politique de confidentialité
          </Heading>
          <Heading as={"h3"} textStyle="h6" mb={2}>
            Traitement des données à caractère personnel
          </Heading>
          <Text>
            Le tableau de bord de l’apprentissage est développé par la Mission nationale pour l’apprentissage, mandatée
            par le ministère du Travail.
          </Text>
        </Section>
        <Section mt={4} id={anchors.Finalite}>
          <Heading as={"h3"} textStyle="h6" mb={2}>
            Finalités
          </Heading>
          <Text>
            Nous manipulons des données à caractère personnel pour améliorer la qualité du suivi et du pilotage de
            l’apprentissage par les différents acteurs. Plus précisément, elles visent à :
          </Text>
          <UnorderedList ml="30px !important" mt="1w">
            <ListItem>
              Produire sous la forme d’un tableau de bord les données synthétiques des effectifs de l&apos;apprentissage
              afin de contribuer au pilotage de l’apprentissage au niveau national et territorial par les acteurs
              publics ou avec délégation de service public ;
            </ListItem>
            <ListItem>
              Identifier les jeunes en recherche de contrat ou en situation de décrochage pour améliorer leur
              accompagnement ;
            </ListItem>
            <ListItem>
              Produire les données nécessaires aux organismes de formation pour répondre aux enquêtes (notamment SIFA) ;
            </ListItem>
            <ListItem>Créer un compte pour accéder ou fournir des données;</ListItem>
            <ListItem>
              Suivre et piloter l&apos;usage du tableau de bord par l&apos;équipe Mission apprentissage ;
            </ListItem>
            <ListItem>Identifier les organismes de formation et leurs réseaux (référentiel).</ListItem>
          </UnorderedList>
        </Section>
        <Section mt={4} id={anchors.DonneesACaracterePersonelTraitees}>
          <Heading as={"h3"} textStyle="h6" mb={2}>
            Données à caractère personnel traitées
          </Heading>
          <Text>
            Nous traitons les données à caractère personnel et catégories de données à caractère personnel suivantes :
          </Text>
          <UnorderedList ml="30px !important" mt="1w">
            <ListItem>
              Données relatives à l’identification du candidat ou jeune (nom, prénom, date de naissance, INE, adresse
              e-mail) ;
            </ListItem>
            <ListItem>Données relatives au représentant légal du jeune (nom, numéro de téléphone) ;</ListItem>
            <ListItem>
              Données relatives aux évènements du parcours des apprenants (date de début et de fin, date de début fin de
              contrat, et rupture, organisme de formation et département) ;
            </ListItem>
            <ListItem>Informations relatives au souhait de formation des candidats ;</ListItem>
            <ListItem>Données de contact des organisme de formation (adresse e-mail) ;</ListItem>
            <ListItem>Données de contact des entreprises (adresse e-mail).</ListItem>
          </UnorderedList>
        </Section>
        <Section mt={4} id={anchors.BaseJuridiqueDuTraitementDeDonnees}>
          <Heading as={"h3"} textStyle="h6" mb={2}>
            Base juridique du traitement de données
          </Heading>
          <Text>
            Nous sommes autorisés à traiter vos données dans le cadre d’une mission d’intérêt public ou relevant de
            l’exercice de l’autorité publique dont est investi le responsable de traitement au sens de l’article 6-e du
            RPGD. Cette mission est notamment précisée dans la lettre de Mission de la Mission nationale pour
            l’apprentissage du 10 septembre 2019 et décision gouvernementale du 26 novembre 2019.
          </Text>
        </Section>
        <Section mt={4} id={anchors.DureeDeConservation}>
          <Heading as={"h3"} textStyle="h6" mb={2}>
            Durée de conservation
          </Heading>
          <Text>
            Nous conservons vos données pour une durée de 2 ans à compter de la dernière modification liée aux
            informations sur un candidat.
          </Text>
        </Section>
        <Section mt={4} id={anchors.DroitDesPersonnesConcernees}>
          <Heading as={"h3"} textStyle="h6" mb={2}>
            Droit des personnes concernées
          </Heading>
          <Text>Vous disposez des droits suivants concernant vos données à caractère personnel :</Text>
          <UnorderedList ml="30px !important" mt="1w">
            <ListItem>Droit d’information et droit d’accès aux données ;</ListItem>
            <ListItem>Droit de rectification des données ;</ListItem>
            <ListItem>Droit d’opposition au traitement de données ;</ListItem>
            <ListItem>Droit à la limitation des données.</ListItem>
          </UnorderedList>
          <Text>
            <br />
            Pour les exercer, faites-nous parvenir une demande en précisant la date et l’heure précise de la requête –
            ces éléments sont indispensables pour nous permettre de retrouver votre recherche – par voie électronique à
            l’adresse suivante :{" "}
            <Link href={`mailto:${CONTACT_ADDRESS}`} color="bluefrance">
              {CONTACT_ADDRESS}
            </Link>
            <br />
            <br />
            Par voie postale :
            <br />
            <br />
            Délégation générale à l’emploi et à la formation professionnelle
            <br />
            14 avenue Duquesne
            <br />
            75350 Paris SP 07
            <br />
            <br />
            En raison de l’obligation de sécurité et de confidentialité dans le traitement des données à caractère
            personnel qui incombe au responsable de traitement, votre demande ne sera traitée que si vous apportez la
            preuve de votre identité. <br />
            Pour vous aider dans votre démarche, vous trouverez ici
            <br />
            <Link href="https://www.cnil.fr/fr/modele/courrier/exercer-son-droit-dacces" color="primary">
              https://www.cnil.fr/fr/modele/courrier/exercer-son-droit-dacces
            </Link>
            , un modèle de courrier élaboré par la CNIL.
            <br />
            <br />
            Le responsable de traitement s’engage à répondre dans un délai raisonnable qui ne saurait dépasser 1 mois à
            compter de la réception de votre demande.
          </Text>
        </Section>
        <Section mt={4} id={anchors.DestinatairesDesDonnees}>
          <Heading as={"h3"} textStyle="h6" mb={2}>
            Destinataires des données
          </Heading>
          <Text>
            Nous nous engageons à ce que les données à caractères personnels soient traitées par les seules personnes
            autorisées.
          </Text>
          <br />
          <Text>Ont accès aux données :</Text>
          <UnorderedList ml="30px !important" mt="1w">
            <ListItem>Les agents autorisés des DREETS, dans le cadre de leurs missions de service public ;</ListItem>
            <ListItem>Les organismes de formation ;</ListItem>
            <ListItem>Les réseaux d’organismes de formation ;</ListItem>
            <ListItem>Les Régions ;</ListItem>
            <ListItem>
              Les personnes autorisées au sein des Rectorats, dans le cadre de leurs missions de service public ;
            </ListItem>
            <ListItem>
              Les personnes autorisées au sein des Académies, dans le cadre de leurs missions de service public ;
            </ListItem>
            <ListItem>
              Les personnes autorisées travaillant pour le compte de la mission interministérielle pour l’apprentissage
              dans le cadre de la conception des services numériques ;
            </ListItem>
            <ListItem>
              Les personnes travaillant pour le compte de la mission interministérielle pour l’apprentissage dans le
              cadre de propositions ciblées d&apos;offres d’emploi ou d’alternance ;
            </ListItem>
          </UnorderedList>
        </Section>
        <Section mt={4} id={anchors.SecuriteEtConfidentialiteDesDonnees}>
          <Heading as={"h3"} textStyle="h6" mb={2}>
            Sécurité et confidentialité des données
          </Heading>
          <Text>
            Les mesures techniques et organisationnelles de sécurité adoptées pour assurer la confidentialité,
            l’intégrité et protéger l’accès des données sont notamment :
          </Text>
          <UnorderedList ml="30px !important" mt="1w">
            <ListItem>Anonymisation ;</ListItem>
            <ListItem>Stockage des données en base de données ;</ListItem>
            <ListItem>Stockage des mots de passe en base sont hachés ;</ListItem>
            <ListItem>Cloisonnement des données ;</ListItem>
            <ListItem>Mesures de traçabilité ;</ListItem>
            <ListItem>Surveillance ;</ListItem>
            <ListItem>Protection contre les virus, malwares et logiciels espions ;</ListItem>
            <ListItem>Protection des réseaux ;</ListItem>
            <ListItem>Sauvegarde ;</ListItem>
            <ListItem>Mesures restrictives limitant l’accès physiques aux données à caractère personnel.</ListItem>
          </UnorderedList>
          <Text as={"h4"} fontSize="30px" fontWeight="700" my={5}>
            Sous-traitants
          </Text>
          <Flex flexDirection={["column", "column", "column", "row"]} w="full">
            <Flex flexDirection={"column"}>
              <Flex border="1px solid" borderBottomWidth={0} borderRightWidth={[1, 1, 1, 0]} p={5}>
                <strong>
                  Partenaire <br />
                  <br />
                </strong>
              </Flex>
              <Flex border="1px solid" borderBottomWidth={0} borderRightWidth={[1, 1, 1, 0]} h="70px" p={5}>
                <Text>OVH SAS</Text>
              </Flex>
            </Flex>
            <Flex flexDirection={"column"}>
              <Flex border="1px solid" borderBottomWidth={0} borderRightWidth={[1, 1, 1, 0]} p={5}>
                <strong>Pays destinataire</strong>
              </Flex>
              <Flex border="1px solid" borderBottomWidth={0} borderRightWidth={[1, 1, 1, 0]} h="70px" p={5}>
                <Text>France</Text>
              </Flex>
              <Flex border="1px solid" h="70px" borderRightWidth={[1, 1, 1, 0]} p={5}>
                <Text>Union européenne</Text>
              </Flex>
            </Flex>
            <Flex flexDirection={"column"}>
              <Flex border="1px solid" borderBottomWidth={0} borderRightWidth={[1, 1, 1, 0]} p={5}>
                <strong>Traitement réalisé</strong>
              </Flex>
              <Flex border="1px solid" borderBottomWidth={0} borderRightWidth={[1, 1, 1, 0]} h="70px" p={5}>
                <Text>Hébergement</Text>
              </Flex>
              <Flex border="1px solid" h="70px" borderRightWidth={[1, 1, 1, 0]} p={5}>
                <Text>Chat de support</Text>
              </Flex>
            </Flex>
            <Flex flexDirection={"column"}>
              <Flex border="1px solid" borderBottomWidth={0} p={5}>
                <strong>
                  Garanties <br />
                  <br />
                </strong>
              </Flex>
              <Flex border="1px solid" borderBottomWidth={0} h="70px" p={5}>
                <Link color="primary" href="https://www.ovhcloud.com/fr/personal-data-protection">
                  https://www.ovhcloud.com/fr/personal-data-protection
                </Link>
              </Flex>
            </Flex>
          </Flex>
          <Text as={"h4"} fontSize="30px" fontWeight="700" my={5}>
            Cookies et autres traceurs
          </Text>
          <Text>
            Un cookie est un fichier déposé sur votre terminal lors de la visite d’un site. Il a pour but de collecter
            des informations relatives à votre navigation et de vous adresser des services adaptés à votre terminal
            (ordinateur, mobile ou tablette).
            <br />
            <br />
            Le site ne dépose pas de cookies de mesure d’audience (nombre de visites, pages consultées). Néanmoins, nous
            utilisons Plausible qui permet de suivre les tendances d’utilisation de notre site. L’outil ne permet pas
            d’identifier les personnes, ni de tracer votre usage d’internet, dans ou en dehors du site.
            <br />
            <br />
            Pour plus d’information à propos de Plausible :
            <br />
            <Link
              color="primary"
              href="https://plausible.io/data-policy#first-thing-first-what-we-collect-and-what-we-use-it-for"
            >
              https://plausible.io/data-policy#first-thing-first-what-we-collect-and-what-we-use-it-for
            </Link>{" "}
            et{" "}
            <Link color="primary" href="https://plausible.io/privacy">
              https://plausible.io/privacy
            </Link>
            .
          </Text>
        </Section>
      </Box>
    </HStack>
  );
};
export default PolitiqueDeConfidentialite;
