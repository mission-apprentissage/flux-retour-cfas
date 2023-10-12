import { Box, Container, Flex, Heading, HStack, Link, ListItem, Text, UnorderedList, VStack } from "@chakra-ui/react";

import { CONTACT_ADDRESS } from "@/common/constants/product";
import { getAuthServerSideProps } from "@/common/SSR/getAuthServerSideProps";
import SimplePage from "@/components/Page/SimplePage";
import Sommaire from "@/components/Sommaire/Sommaire";

export const getServerSideProps = async (context) => ({ props: { ...(await getAuthServerSideProps(context)) } });

const anchors = {
  EditeurDuSite: "editeur-du-site",
  DirecteurDeLaPublication: "directeur-de-la-publication",
  HebergementDuSite: "hebergement-du-site",
  Accessibilite: "accessibilite",
  ProtectionDesDonnees: "protection-des-donnees",
  SignalerUnDysfonctionnement: "signaler-un-dysfonctionnement",
};

const SommaireData = [
  { anchorTitle: "1", anchorName: "Éditeur du site", anchorLink: "editeur-du-site" },
  { anchorTitle: "2", anchorName: "Directeur de la publication", anchorLink: "directeur-de-la-publication" },
  { anchorTitle: "3", anchorName: "Hébergement du site", anchorLink: "hebergement-du-site" },
  {
    anchorTitle: "4",
    anchorName: "Accessibilité",
    anchorLink: "accessibilite",
  },
  { anchorTitle: "5", anchorName: "Protection des données", anchorLink: "protection-des-donnees" },
  { anchorTitle: "6", anchorName: "Signaler un dysfonctionnement", anchorLink: "signaler-un-dysfonctionnement" },
];

const MentionsLegalesPage = () => {
  return (
    <SimplePage title="Mentions légales">
      <Container maxW="xl" p="8">
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
          <Container maxWidth="xl">
            <VStack gap={8}>
              <Box w="100%">
                <HStack justifyContent="space-between">
                  <Heading textStyle="h1" color="grey.800">
                    Mentions légales
                  </Heading>

                  <Text color="grey.400" fontWeight="bold" align="right" float="right">
                    Mise à jour&nbsp;: 6 octobre 2023
                  </Text>
                </HStack>
                <Text mt={4}>Mentions légales du site « tableau de bord de l’apprentissage »</Text>
              </Box>
              <Box id={anchors.EditeurDuSite}>
                <Heading as="h2" textStyle="h6" mb={2}>
                  Éditeur du site
                </Heading>
                <Text>
                  Ce site est édité par la Délégation Générale à l’Emploi et à la Formation Professionnelle (DGEFP) et
                  la Mission interministérielle de l’apprentissage.
                  <br />
                  <br />
                  10-18 place des 5 Martyrs du Lycée Buffon
                  <br /> 75015 Paris
                </Text>
              </Box>
              <Box id={anchors.DirecteurDeLaPublication}>
                <Heading as="h2" textStyle="h6" mb={2}>
                  Directeur de la publication
                </Heading>
                <Text>
                  Le Directeur de la publication est Monsieur Bruno Lucas, Délégué général à l’Emploi et à la Formation
                  Professionnelle.
                </Text>
              </Box>
              <Box id={anchors.HebergementDuSite}>
                <Heading as="h2" textStyle="h6" mb={2}>
                  Hébergement du site
                </Heading>
                <Text>
                  L’hébergement est assuré par OVH SAS, situé à l’adresse suivante&nbsp;:
                  <br />
                  2 rue Kellermann
                  <br />
                  59100 Roubaix
                  <br />
                  Standard&nbsp;: 09.72.10.07
                  <br />
                  <br />
                  La conception et la réalisation du site sont effectuée par La Mission Interministérielle pour
                  l’apprentissage, située à l’adresse suivante&nbsp;:
                  <br />
                  Beta.gouv
                  <br />
                  20 avenue de Ségur
                  <br />
                  75007 Paris
                </Text>
              </Box>
              <Box id={anchors.Accessibilite}>
                <Heading as="h2" textStyle="h6" mb={2}>
                  Accessibilité
                </Heading>
                <Text>
                  La conformité aux normes d’accessibilité numérique est un objectif ultérieur mais nous tâchons de
                  rendre ce site accessible à toutes et à tous.
                </Text>
              </Box>
              <Box id={anchors.ProtectionDesDonnees}>
                <Heading as="h2" textStyle="h6" mb={2}>
                  Protection des données
                </Heading>
                <BoxProtectionDesDonnees />
              </Box>
              <Box id={anchors.SignalerUnDysfonctionnement}>
                <Heading as="h2" textStyle="h6" mb={2}>
                  Signaler un dysfonctionnement
                </Heading>
                <Text>
                  Si vous rencontrez un défaut d’accessibilité vous empêchant d’accéder à un contenu ou une
                  fonctionnalité du site, merci de nous en faire part.
                  <br />
                  Si vous n’obtenez pas de réponse rapide de notre part, vous êtes en droit de faire parvenir vos
                  doléances ou une demande de saisine au Défenseur des droits.
                </Text>
              </Box>
            </VStack>
          </Container>
        </HStack>
      </Container>
    </SimplePage>
  );
};

export default MentionsLegalesPage;

function BoxProtectionDesDonnees() {
  return (
    <VStack gap={8} alignItems="start">
      <Box>
        <Heading as="h3" fontSize="beta" mb={2}>
          Traitement des données à caractère personnel
        </Heading>
        <Text>
          LLe ministère du Travail, du Plein emploi et de l’insertion traite vos données dans le cadre du Tableau de
          bord de l’apprentissage, développé par la Mission interministérielle pour l’apprentissage.
        </Text>
      </Box>

      <Box>
        <Heading as="h3" fontSize="beta" mb={2}>
          Finalités
        </Heading>
        <Text>
          Nous manipulons des données à caractère personnel pour améliorer la qualité du suivi et du pilotage de
          l’apprentissage par les différents acteurs. Plus précisément, elles visent à&nbsp;:
        </Text>
        <UnorderedList ml="30px !important" mt="1w">
          <ListItem>Piloter les dispositifs relatifs à la politique de l’apprentissage&nbsp;;</ListItem>
          <ListItem>
            Aider ceux qui peuvent agir à accompagner les apprentis en situation de rupture ou sans contrat&nbsp;;
          </ListItem>
          <ListItem>
            Simplifier la délivrance d’informations par les CFA, en utilisant la donnée pour pré-remplir les enquêtes
            nationales qui leur sont demandées.
          </ListItem>
        </UnorderedList>
      </Box>

      <Box>
        <Heading as="h3" fontSize="beta" mb={2}>
          Données à caractère personnel traitées
        </Heading>
        <UnorderedList ml="30px !important" mt="1w">
          <ListItem>Données relatives à l’identification du candidat ou jeune&nbsp;</ListItem>
          <ListItem>Données relatives au représentant légal du jeune&nbsp;</ListItem>
          <ListItem>Données relatives aux événements du parcours des apprenants&nbsp;</ListItem>
          <ListItem>Informations relatives au souhait de formation des candidats&nbsp;</ListItem>
          <ListItem>Données de contact des représentants des organismes de formation&nbsp;</ListItem>
          <ListItem>Données de contact des représentants des entreprises.</ListItem>
        </UnorderedList>
      </Box>

      <Box>
        <Heading as="h3" fontSize="beta" mb={2}>
          Base juridique du traitement de données
        </Heading>
        <Text>
          Nous sommes autorisés à traiter vos données dans le cadre d’une mission d’intérêt public dont est investi le
          responsable de traitement au sens de l’article 6-1 e) du RPGD.
        </Text>
      </Box>

      <Box>
        <Heading as="h3" fontSize="beta" mb={2}>
          Destinataires des données
        </Heading>
        <Text>
          Nous nous engageons à ce que les données à caractère personnel soient traitées par les seules personnes
          autorisées à savoir&nbsp;:
        </Text>

        <UnorderedList ml="30px !important" mt="1w">
          <ListItem>
            La Délégation générale à l’emploi et à la formation professionnelle et sous-traitants, ainsi que les membres
            de l’équipe de la Mission interministérielle pour l’apprentissage notamment La bonne alternance&nbsp;;
          </ListItem>
          <ListItem>
            Les agents autorisés des DREETS, DRIEETS, DDETS, DRAAF, dans le cadre de leurs missions de service
            public&nbsp;;
          </ListItem>
          <ListItem>Les organismes de formation (responsable, formateur, responsable-formateur)&nbsp;;</ListItem>
          <ListItem>Les réseaux des organismes de formation&nbsp;;</ListItem>
          <ListItem>Les conseils régionaux&nbsp;;</ListItem>
          <ListItem>Les académies&nbsp;;</ListItem>
          <ListItem>InterCarif Oref National&nbsp;;</ListItem>
          <ListItem>Carif Oref Régional.</ListItem>
        </UnorderedList>
        <Text>Les données sont hébergées chez OVH.</Text>
      </Box>

      <Box>
        <Heading as="h3" fontSize="beta" mb={2}>
          Durée de conservation des données
        </Heading>
        <Text>
          Nous conservons vos données pour une durée de 2 ans à compter du dernier contact avec les personnes concernées
          susvisées.
        </Text>
      </Box>

      <Box>
        <Heading as="h3" fontSize="beta" mb={2}>
          Droit des personnes concernées
        </Heading>
        <Text>Vous disposez des droits suivants concernant vos données à caractère personnel&nbsp;:</Text>
        <UnorderedList ml="30px !important" mt="1w">
          <ListItem>Droit d’information et droit d’accès aux données&nbsp;;</ListItem>
          <ListItem>Droit de rectification&nbsp;;</ListItem>
          <ListItem>Droit d’opposition au traitement des données&nbsp;;</ListItem>
          <ListItem>Droit à la limitation du traitement.</ListItem>
        </UnorderedList>
        <Text mt={4}>
          Pour les exercer, faites-nous parvenir une demande en précisant la date et l’heure précise de la requête – ces
          éléments sont indispensables pour nous permettre de retrouver votre recherche – par voie électronique à
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
          Pour vous aider dans votre démarche, vous trouverez un modèle de courrier élaboré par la CNIL ici&nbsp;:{" "}
          <Link href="https://www.cnil.fr/fr/modele/courrier/exercer-son-droit-dacces" color="primary">
            https://www.cnil.fr/fr/modele/courrier/exercer-son-droit-dacces
          </Link>
        </Text>
        <Text mt={4}>
          Si vous estimez, après avoir contacté la DGEFP, que vos droits ne sont pas respectés ou que le traitement
          n’est pas conforme au Règlement Général sur la Protection des Données, vous pouvez adresser une réclamation
          auprès de la Commission Nationale de l’Informatique et des Libertés (CNIL).
        </Text>
      </Box>

      <Box>
        <Heading as="h3" fontSize="beta" mb={2}>
          Cookies
        </Heading>
        <Text>
          Un cookie est un fichier déposé sur votre terminal lors de la visite d’un site. Il a pour but de collecter des
          informations relatives à votre navigation et de vous adresser des services adaptés à votre terminal
          (ordinateur, mobile ou tablette).
        </Text>
        <Text mt={4}>
          Le site du tableau de bord de l’apprentissage ne dépose pas de cookies de mesure d’audience. Néanmoins, nous
          utilisons Plausible qui permet de suivre les tendances d’utilisation de notre site. L’outil ne collecte aucune
          donnée à caractère personnel et ne dépose aucun cookie. Il ne permet ni d’identifier les personnes, ni de
          tracer leur usage d’internet dans ou en dehors du site.
        </Text>
        <Text mt={4}>Pour plus d’informations sur Plausible&nbsp;:</Text>

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
      </Box>
    </VStack>
  );
}
