import {
  Box,
  Center,
  Container,
  Flex,
  Heading,
  HStack,
  Image,
  List,
  ListItem,
  Stack,
  Text,
  VStack,
} from "@chakra-ui/react";
import { ReactNode } from "react";

import { OrganisationType } from "@/common/internal/Organisation";
import { getAuthServerSideProps } from "@/common/SSR/getAuthServerSideProps";
import { formatDate } from "@/common/utils/dateUtils";
import Link from "@/components/Links/Link";
import SimplePage from "@/components/Page/SimplePage";
import useAuth from "@/hooks/useAuth";
import DashboardOrganisme from "@/modules/dashboard/DashboardOrganisme";
import DashboardTransverse from "@/modules/dashboard/DashboardTransverse";

export const getServerSideProps = async (context) => ({ props: { ...(await getAuthServerSideProps(context)) } });

function getDashboardComponent(organisationType: OrganisationType) {
  switch (organisationType) {
    case "ORGANISME_FORMATION_FORMATEUR":
    case "ORGANISME_FORMATION_RESPONSABLE":
    case "ORGANISME_FORMATION_RESPONSABLE_FORMATEUR": {
      return <DashboardOrganisme />;
    }

    case "TETE_DE_RESEAU":
    case "DREETS":
    case "DRAAF":
    case "CONSEIL_REGIONAL":
    case "DDETS":
    case "ACADEMIE":
    case "OPERATEUR_PUBLIC_NATIONAL":
    case "ADMINISTRATEUR":
      return <DashboardTransverse />;
  }
}

function DashboardPage() {
  const { organisationType } = useAuth();

  return <SimplePage title="Tableau de bord de l’apprentissage">{getDashboardComponent(organisationType)}</SimplePage>;
}

function PublicLandingPage() {
  return (
    <SimplePage title="Tableau de bord de l’apprentissage">
      <Box
        borderTop="solid 1px"
        borderTopColor="grey.300"
        borderBottom="solid 1px"
        borderBottomColor="grey.300"
        bg="linear-gradient(86.78deg, #3558A2 0.27%, rgba(53, 88, 162, 0.85) 44.27%, rgba(238, 241, 248, 0.54) 99.66%)"
      >
        <Container maxW="xl" py="10" display="flex" alignItems={"center"} gap="16">
          <Box flex="3">
            <Heading as="h1" fontSize="5xl" color="#ffffff" lineHeight="120%">
              Tableau de bord de l’apprentissage
            </Heading>
            <Text color="#ffffff" mt={5}>
              Pour un accompagnement des jeunes vers l’emploi, et pour un pilotage, en temps réel, de l’apprentissage
              dans les territoires.
            </Text>
            <HStack gap={5} mt={5}>
              <Link variant="primary" href="/auth/inscription">
                Je m’inscris
              </Link>
              <Link variant="secondary" href="/auth/connexion">
                J’ai déjà un compte
              </Link>
            </HStack>
          </Box>

          <Image
            src="/images/landing-presentation-tdb.svg"
            alt="Graphique tableau de bord"
            flex="2"
            userSelect="none"
          />
        </Container>
      </Box>
      <Container maxW="xl" py="8">
        <Heading as="h2" color="#465F9D" fontSize="beta" fontWeight="700" mb={3}>
          Vous êtes un acteur de l’apprentissage&nbsp;?
        </Heading>

        <Stack direction={["column", "column", "column", "row"]} gap="4" mb="16" mt="8" mx={[0, 16, 32, 0]}>
          <VStack flex="1" backgroundColor="galt2" px="4" py="8">
            <Center>
              <VStack>
                <Image src="/images/landing-cards/school.svg" alt="" />
                <CardLabel>OFA</CardLabel>
                <Text fontSize="delta" fontWeight="bold">
                  Simplifiez vos démarches
                </Text>
              </VStack>
            </Center>
            <List styleType="none" pt="8" spacing="2">
              <ListItem>
                <Flex align="center" fontSize="omega">
                  <Image src="/images/landing-cards/shield-user.svg" boxSize="16px" alt="" mr="1" />
                  Transmettez vos effectifs de manière sécurisée
                </Flex>
              </ListItem>
              <ListItem>
                <Flex align="center" fontSize="omega">
                  <Image src="/images/landing-cards/timer-flash.svg" boxSize="16px" alt="" mr="1" />
                  Gagnez du temps pour vos démarches administratives
                </Flex>
              </ListItem>
            </List>
          </VStack>
          <VStack flex="1" backgroundColor="galt2" p="8">
            <Center>
              <VStack>
                <Image src="/images/landing-cards/network.svg" alt="" />
                <CardLabel>RÉSEAU DE CFA</CardLabel>
                <Text fontSize="delta" fontWeight="bold">
                  Facilitez votre animation
                </Text>
              </VStack>
            </Center>
            <List styleType="none" pt="8" spacing="2">
              <ListItem>
                <Flex align="center" fontSize="omega">
                  <Image src="/images/landing-cards/team.svg" boxSize="16px" alt="" mr="1" />
                  Informez-vous en temps réel pour suivre votre réseau
                </Flex>
              </ListItem>
              <ListItem>
                <Flex align="center" fontSize="omega">
                  <Image src="/images/landing-cards/file-damaged.svg" boxSize="16px" alt="" mr="1" />
                  Pilotez votre réseau par la donnée en temps réel
                </Flex>
              </ListItem>
            </List>
          </VStack>
          <VStack flex="1" backgroundColor="galt2" p="8">
            <Center>
              <VStack>
                <Image src="/images/landing-cards/city-hall.svg" alt="" />
                <CardLabel>OPÉRATEURS PUBLICS</CardLabel>
                <Text fontSize="delta" fontWeight="bold">
                  Pilotez efficacement
                </Text>
              </VStack>
            </Center>
            <List styleType="none" pt="8" spacing="2">
              <ListItem>
                <Flex align="center" fontSize="omega">
                  <Image src="/images/landing-cards/bar-chart.svg" boxSize="16px" alt="" mr="1" />
                  Visualisez des données ciblées sur votre territoire
                </Flex>
              </ListItem>
              <ListItem>
                <Flex align="center" fontSize="omega">
                  <Image src="/images/landing-cards/alarm-warning.svg" boxSize="16px" alt="" mr="1" />
                  Identifiez rapidement des besoins d’accompagnement
                </Flex>
              </ListItem>
            </List>
          </VStack>
        </Stack>

        <Heading as="h2" color="#465F9D" fontSize="beta" fontWeight="700" mb={3}>
          Aperçu des chiffres-clés de l’apprentissage
        </Heading>
        <Text fontSize="sm" fontWeight="bold">
          Répartition des effectifs de l’apprentissage en temps réel.
        </Text>
        <Text fontSize="sm">
          Ces chiffres reflètent partiellement les effectifs de l’apprentissage : une partie des organismes de formation
          ne transmettent pas encore leurs données au tableau de bord.
        </Text>
        <Text fontSize="sm">
          Le <Text as="b">{formatDate(new Date(), "d MMMM yyyy")}</Text>, le tableau de bord de l’apprentissage recense{" "}
          <Text as="b">43 765 apprenants</Text> dans votre territoire, dont <Text as="b">31 080 apprentis</Text>,{" "}
          <Text as="b">580 rupturants</Text> et <Text as="b">705 jeunes sans contrat</Text>.
        </Text>
      </Container>

      <Box backgroundColor="galt" py="4" px="8">
        <Container maxW="xl" py="8">
          <Heading as="h2" color="#465F9D" fontSize="beta" fontWeight="700" mb={8}>
            Nos missions de service public
          </Heading>

          <Stack direction={["column", "column", "row", "row"]} gap={[4, 4, 6, 12]}>
            <VStack flex="1" gap="1" alignItems="start">
              <HStack>
                <Box
                  minW={12}
                  h={12}
                  border="1px solid #3558A2"
                  borderRadius="50%"
                  textAlign="center"
                  color="#3558A2"
                  fontSize="beta"
                  fontWeight="bold"
                >
                  1
                </Box>
                <Text color="#465F9D" fontSize="delta" fontWeight="bold">
                  Pour les jeunes
                </Text>
              </HStack>
              <Image
                src="/images/landing-missions-jeunes.svg"
                alt="Accompagner les apprentis"
                userSelect="none"
                h={["160px", "160px", "120px", "120px"]}
                alignSelf="center"
              />
              <Heading as="h3" fontSize="gamma">
                Accompagner les apprentis
              </Heading>
              <Text color="#3A3A3A" fontSize="zeta">
                En recherche de contrat ou en risque de décrochage scolaire
              </Text>
            </VStack>

            <VStack flex="1" gap="1" alignItems="start">
              <HStack>
                <Box
                  minW={12}
                  h={12}
                  border="1px solid #3558A2"
                  borderRadius="50%"
                  textAlign="center"
                  color="#3558A2"
                  fontSize="beta"
                  fontWeight="bold"
                >
                  2
                </Box>
                <Text color="#465F9D" fontSize="delta" fontWeight="bold">
                  Pour les organismes
                </Text>
              </HStack>
              <Image
                src="/images/landing-missions-organismes.svg"
                alt="Simplifier les démarches"
                userSelect="none"
                h={["160px", "160px", "120px", "120px"]}
                alignSelf="center"
              />
              <Heading as="h3" fontSize="gamma">
                Simplifier les démarches
              </Heading>
              <Text color="#3A3A3A" fontSize="zeta">
                Certaines démarches administratives pour les CFA et leurs réseaux
              </Text>
            </VStack>

            <VStack flex="1" gap="1" alignItems="start">
              <HStack>
                <Box
                  minW={12}
                  h={12}
                  border="1px solid #3558A2"
                  borderRadius="50%"
                  textAlign="center"
                  color="#3558A2"
                  fontSize="beta"
                  fontWeight="bold"
                >
                  3
                </Box>
                <Text color="#465F9D" fontSize="delta" fontWeight="bold">
                  Pour les services publics
                </Text>
              </HStack>
              <Image
                src="/images/landing-missions-services-publics.svg"
                alt="Piloter l’apprentissage"
                userSelect="none"
                h={["160px", "160px", "120px", "120px"]}
                alignSelf="center"
              />
              <Heading as="h3" fontSize="gamma">
                Piloter l’apprentissage
              </Heading>
              <Text color="#3A3A3A" fontSize="zeta">
                Grâce aux données en temps réel dans un territoire ou un secteur économique
              </Text>
            </VStack>
          </Stack>
        </Container>
      </Box>
    </SimplePage>
  );
}

function CardLabel({ children }: { children: ReactNode }) {
  return (
    <Box
      backgroundColor="purpleglycine.950"
      color="purpleglycinesun.319"
      px="2"
      py="1"
      fontSize="omega"
      borderRadius="md"
      fontWeight="bold"
    >
      {children}
    </Box>
  );
}

export default function Home() {
  const { auth } = useAuth();
  // FIXME vérifier le chargement
  return auth ? <DashboardPage /> : <PublicLandingPage />;
}
