import {
  Box,
  Center,
  Container,
  Divider,
  Flex,
  Grid,
  GridItem,
  Heading,
  HStack,
  Image,
  List,
  ListItem,
  Spinner,
  Stack,
  Tag,
  Text,
  Tooltip,
  UnorderedList,
  VStack,
} from "@chakra-ui/react";
import { useRouter } from "next/router";
import { ReactNode, useState } from "react";

import { _get } from "@/common/httpClient";
import { OrganisationType } from "@/common/internal/Organisation";
import { getAuthServerSideProps } from "@/common/SSR/getAuthServerSideProps";
import { formatDate } from "@/common/utils/dateUtils";
import { formatNumber, prettyFormatNumber } from "@/common/utils/stringUtils";
import Link from "@/components/Links/Link";
import SimplePage from "@/components/Page/SimplePage";
import { useOrganisationOrganisme } from "@/hooks/organismes";
import useAuth from "@/hooks/useAuth";
import CarteFrance from "@/modules/dashboard/CarteFrance";
import DashboardOrganisme from "@/modules/dashboard/DashboardOrganisme";
import DashboardTransverse from "@/modules/dashboard/DashboardTransverse";
import { useIndicateurNational } from "@/modules/dashboard/hooks/useIndicateursNational";
import { TeamIcon } from "@/modules/dashboard/icons";
import { TerritoireFilters } from "@/modules/models/effectifs-filters";
import { LockFill } from "@/theme/components/icons";

export const getServerSideProps = async (context) => ({ props: { ...(await getAuthServerSideProps(context)) } });

function DashboardOwnOrganisme() {
  const { organisme } = useOrganisationOrganisme();
  return <DashboardOrganisme organisme={organisme} modePublique={false} />;
}

function getDashboardComponent(organisationType: OrganisationType) {
  switch (organisationType) {
    case "ORGANISME_FORMATION": {
      return <DashboardOwnOrganisme />;
    }

    case "TETE_DE_RESEAU":
    case "DREETS":
    case "DRAAF":
    case "CONSEIL_REGIONAL":
    case "CARIF_OREF_REGIONAL":
    case "DRAFPIC":
    case "DDETS":
    case "ACADEMIE":
    case "OPERATEUR_PUBLIC_NATIONAL":
    case "CARIF_OREF_NATIONAL":
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
      <Center bg="#F5F5FE" color="plaininfo" fontWeight="bold" lineHeight="1.2em" p={2}>
        <Image src="/images/landing-cards/info.svg" alt="" userSelect="none" mr="3" />
        Informations actualisées ! Consultez les nouveaux effectifs d&apos;apprenants pour l&apos;année scolaire
        démarrant en août, sur le tableau de bord de l&apos;apprentissage.
      </Center>

      <Box
        borderTop="solid 1px"
        borderTopColor="grey.300"
        borderBottom="solid 1px"
        borderBottomColor="grey.300"
        bg="linear-gradient(86.78deg, #3558A2 0.27%, rgba(53, 88, 162, 0.85) 44.27%, rgba(238, 241, 248, 0.54) 99.66%)"
      >
        <Container
          maxW="xl"
          py="10"
          display="flex"
          alignItems="center"
          gap="16"
          flexDirection={["column-reverse", "column-reverse", "column-reverse", "row"]}
        >
          <Box flex="3">
            <Heading as="h1" fontSize="5xl" color="#ffffff" lineHeight="120%">
              Tableau de bord de l’apprentissage
            </Heading>
            <Text color="#ffffff" mt={5}>
              Pour un accompagnement des jeunes vers l’emploi, et pour un pilotage, en temps réel, de l’apprentissage
              dans les territoires.
            </Text>
            <HStack gap={5} mt={5}>
              <Link variant="primary" href="/auth/inscription" plausibleGoal="clic_homepage_inscription_bandeau">
                Je m’inscris
              </Link>
              <Link variant="secondary" href="/auth/connexion" plausibleGoal="clic_homepage_connexion_bandeau">
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
      <Container maxW="xl" py="16">
        <Heading as="h2" color="#465F9D" fontSize="beta" fontWeight="700" mb={3}>
          Vous êtes un acteur de l’apprentissage&nbsp;?
        </Heading>

        <Stack direction={["column", "column", "column", "row"]} gap="4" mt="8" mx={[0, 16, 32, 0]}>
          <Link
            variant="ghost"
            href="/organismes-formation"
            flex="1"
            backgroundColor="galt"
            p="8"
            display="flex"
            flexDirection="column"
            alignItems="center"
          >
            <Center>
              <VStack>
                <Image src="/images/landing-cards/school.svg" alt="" />
                <CardLabel>ORGANISME DE FORMATION (OFA)</CardLabel>
                <Text fontSize="delta" fontWeight="bold">
                  Simplifiez vos démarches
                </Text>
              </VStack>
            </Center>
            <List styleType="none" pt="8" spacing="2">
              <ListItem>
                <Flex align="center" fontSize="omega">
                  <Image src="/images/landing-cards/timer-flash.svg" boxSize="16px" alt="" mr="2" />
                  Gagnez du temps pour vos démarches administratives
                </Flex>
              </ListItem>
              <ListItem>
                <Flex align="center" fontSize="omega">
                  <Image src="/images/landing-cards/shield-user.svg" boxSize="16px" alt="" mr="2" />
                  Transmettez vos effectifs de manière sécurisée
                </Flex>
              </ListItem>
            </List>
          </Link>
          <Link
            variant="ghost"
            href="/organismes-formation"
            flex="1"
            backgroundColor="galt"
            p="8"
            display="flex"
            flexDirection="column"
            alignItems="center"
          >
            <Center>
              <VStack>
                <Image src="/images/landing-cards/network.svg" alt="" />
                <CardLabel>RÉSEAU D’OFA</CardLabel>
                <Text fontSize="delta" fontWeight="bold">
                  Facilitez votre animation
                </Text>
              </VStack>
            </Center>
            <List styleType="none" pt="8" spacing="2">
              <ListItem>
                <Flex align="center" fontSize="omega">
                  <TeamIcon boxSize="16px" mr="2" />
                  Suivez l’activité de votre réseau en temps réel
                </Flex>
              </ListItem>
              <ListItem>
                <Flex align="center" fontSize="omega">
                  <Image src="/images/landing-cards/file-damaged.svg" boxSize="16px" alt="" mr="2" />
                  Centralisez les informations utiles à l’animation de celui-ci
                </Flex>
              </ListItem>
            </List>
          </Link>
          <Link
            variant="ghost"
            href="/operateurs-publics"
            flex="1"
            backgroundColor="galt"
            p="8"
            display="flex"
            flexDirection="column"
            alignItems="center"
          >
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
                  <Image src="/images/landing-cards/bar-chart.svg" boxSize="16px" alt="" mr="2" />
                  Visualisez des données ciblées sur votre territoire
                </Flex>
              </ListItem>
              <ListItem>
                <Flex align="center" fontSize="omega">
                  <Image src="/images/landing-cards/alarm-warning.svg" boxSize="16px" alt="" mr="2" />
                  <Text>
                    Mobilisez rapidement le{" "}
                    <Text as="abbr" title="SPIE : Service public de l’insertion et de l’emploi" cursor="help">
                      SPIE
                    </Text>{" "}
                    en cas de difficultés des apprentis
                  </Text>
                </Flex>
              </ListItem>
            </List>
          </Link>
        </Stack>

        <SectionApercuChiffresCles />
      </Container>

      <Box backgroundColor="galt" px="8">
        <Container maxW="xl" py="14">
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
                alt="Simplifiez vos démarches"
                userSelect="none"
                h={["160px", "160px", "120px", "120px"]}
                alignSelf="center"
              />
              <Heading as="h3" fontSize="gamma">
                Simplifiez vos démarches
              </Heading>
              <Text color="#3A3A3A" fontSize="zeta">
                En permettant facilement de répondre aux multiples enquêtes pour lesquelles vous êtes sollicités.
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
                Pour adapter les besoins et l’offre de formation sur un territoire ou sur un secteur économique.
              </Text>
            </VStack>
          </Stack>
        </Container>
      </Box>

      <Container maxW="xl" bg="#F5F5FE" px="14" py="10" my="20">
        <Text fontWeight="bold" color="blue_cumulus_main" fontSize="gamma">
          Suivez nos actualités sur LinkedIn «&nbsp;Mission Interministérielle pour l’apprentissage&nbsp;»
        </Text>
        <Text mt={4}>
          La Mission interministérielle pour l’apprentissage construit des services numériques qui facilitent les
          entrées en apprentissage.
        </Text>
        <Link
          variant="whiteBg"
          mt="6"
          display="inline-flex"
          alignItems="center"
          href="https://fr.linkedin.com/company/mission-apprentissage"
          plausibleGoal="clic_homepage_page_linkedin"
          isExternal
        >
          <Image src="/images/landing-cards/linkedin.svg" alt="" userSelect="none" mr="3" />
          Voir notre page
        </Link>
      </Container>
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
      textAlign="center"
    >
      {children}
    </Box>
  );
}

function SectionApercuChiffresCles() {
  const router = useRouter();
  const [indicateursFilters] = useState<TerritoireFilters>({
    date: new Date(),
    organisme_regions: [],
    organisme_departements: [],
    organisme_academies: [],
    organisme_bassinsEmploi: [],
  });

  const { effectifs, organismes, isReady } = useIndicateurNational(indicateursFilters, router.isReady);

  return (
    <Container maxW="xl" py="b" px="0" mt="20">
      <Heading as="h2" color="#465F9D" fontSize="beta" fontWeight="700" mb={3}>
        Aperçu des chiffres-clés de l’apprentissage
      </Heading>
      <Text fontSize="sm" fontWeight="bold">
        Répartition des effectifs de l’apprentissage au National en temps réel.
      </Text>
      <Text fontSize="sm" color="mgalt">
        Ces chiffres reflètent partiellement les effectifs de l’apprentissage : une partie des organismes de formation
        en apprentissage ne transmettent pas encore leurs données au tableau de bord.
      </Text>
      <Text fontSize="sm" mt="4" p="3" bg="#F9F8F6" borderRadius="4px" lineHeight="1">
        Le <Text as="b">{formatDate(new Date(), "d MMMM yyyy")}</Text>, le tableau de bord de l’apprentissage recense
        sur le territoire national <Text as="b">{formatNumber(effectifs?.total.apprenants)} apprenants</Text>, dont{" "}
        <Text as="b">{formatNumber(effectifs?.total.apprentis)} apprentis</Text>,{" "}
        <Text as="b">{formatNumber(effectifs?.total.inscritsSansContrat)} jeunes sans contrat</Text> et{" "}
        <Text as="b">{formatNumber(effectifs?.total.rupturants)} rupturants</Text>.
      </Text>

      <Grid templateColumns={["1fr", "1fr", "1fr 2fr"]} gap={4} my={4}>
        <GridItem bg="#F5F5FE">
          <Center h="100%">
            <HStack gap={3} py="10" px={["2", "6", "12"]}>
              <Box alignSelf={"start"} pt="3">
                <Image src="/images/landing-cards/community.svg" boxSize="10" alt="" userSelect="none" />
              </Box>
              <Box>
                <Text fontSize="40px" fontWeight="700" color="bluefrance">
                  {formatNumber(organismes?.total.totalOrganismes.total)}
                </Text>
                <Text fontSize="zeta" fontWeight="700" lineHeight="1em" color="bluefrance">
                  organismes de formation en apprentissage
                  <Tooltip
                    background="bluefrance"
                    color="white"
                    label={
                      <Box padding="1w">
                        <b>Organismes de formation en apprentissage (OFA)</b>
                        <Text as="p">Nombre d’organismes reconnus par le tableau de bord comme&nbsp;:</Text>
                        <UnorderedList>
                          <ListItem>
                            trouvés dans le{" "}
                            <Link href="https://catalogue-apprentissage.intercariforef.org/" textDecoration="underLine">
                              Catalogue des formations en apprentissage
                            </Link>{" "}
                            (base des Carif-Oref)&nbsp;;
                          </ListItem>
                          <ListItem>identifiés par un SIRET (ouvert) et un UAI valable&nbsp;;</ListItem>
                          <ListItem>ayant envoyé des données&nbsp;;</ListItem>
                        </UnorderedList>
                        <Text as="p">
                          Ce nombre inclut&nbsp;: les OFA «&nbsp;historiques&nbsp;», les OFA académiques et
                          d’entreprise, les lycées avec une section apprentissage, les prépa-apprentissage.
                        </Text>
                      </Box>
                    }
                  >
                    <Box
                      as="i"
                      className="ri-information-line"
                      fontSize="epsilon"
                      color="grey.500"
                      marginLeft="1w"
                      verticalAlign="middle"
                    />
                  </Tooltip>
                </Text>
                <Text fontSize="zeta" color="mgalt">
                  transmettent au tableau de bord sur <b>{formatNumber(organismes?.total.totalOrganismes.total)}</b> OFA
                  fiables.
                </Text>
                <Divider size="md" my={2} borderBottomWidth="2px" opacity="1" />
                <Text fontSize="zeta" color="mgalt">
                  dont&nbsp;:
                </Text>
                <Text fontSize="zeta">
                  <Text as="b">{formatNumber(organismes?.total.totalOrganismes?.responsables)}</Text> responsables
                </Text>
                <Text fontSize="zeta">
                  <Text as="b">{formatNumber(organismes?.total.totalOrganismes?.responsablesFormateurs)}</Text>{" "}
                  responsables et formateurs
                </Text>
                <Text fontSize="zeta">
                  <Text as="b">{formatNumber(organismes?.total.totalOrganismes?.formateurs)}</Text> formateurs
                </Text>
                <Tag
                  mt={4}
                  borderRadius="full"
                  fontSize="omega"
                  boxShadow="inset 0 0 0px 1px #000091"
                  variant="outline"
                  color="bluefrance"
                >
                  Soit&nbsp;
                  <Text as="b" fontSize="zeta">
                    {prettyFormatNumber(organismes?.total.tauxCouverture.total ?? 0)}%
                  </Text>
                  &nbsp;des établissements
                </Tag>
              </Box>
            </HStack>
          </Center>
        </GridItem>

        <GridItem bg="#F5F5FE">
          <Stack direction={["column", "row", "row"]}>
            <Center h="100%">
              <HStack gap={3} py="10" px={["2", "6", "12"]}>
                <Box alignSelf={"start"} pt="3">
                  <TeamIcon fill="bluefrance" />
                </Box>
                <Box>
                  <Text fontSize="40px" fontWeight="700" color="bluefrance">
                    {formatNumber(effectifs?.total.apprenants)}
                  </Text>
                  <Text fontSize="zeta" fontWeight="700" lineHeight="1em" color="bluefrance">
                    apprenants
                    <Tooltip
                      background="bluefrance"
                      color="white"
                      label={
                        <Box padding="1w">
                          <b>Nombre d’apprenants en contrat d’apprentissage</b>
                          <br />
                          Cet indicateur est basé sur la réception d’un statut transmis par les organismes de formation.
                          Est considéré comme un apprenant, un jeune inscrit en formation dans un organisme de formation
                          en apprentissage. Il peut être&nbsp;:
                          <UnorderedList>
                            <ListItem>en formation et en recherche d’une entreprise (pas de contrat de signé)</ListItem>
                            <ListItem>apprenti en entreprise (son contrat est signé)</ListItem>
                            <ListItem>
                              apprenti en rupture de contrat d’apprentissage et à la recherche d’un nouvel employeur
                            </ListItem>
                          </UnorderedList>
                        </Box>
                      }
                    >
                      <Box
                        as="i"
                        className="ri-information-line"
                        fontSize="epsilon"
                        color="grey.500"
                        marginLeft="1w"
                        verticalAlign="middle"
                      />
                    </Tooltip>
                  </Text>
                  <Divider size="md" my={2} borderBottomWidth="2px" opacity="1" />
                  <Text fontSize="zeta" color="mgalt">
                    dont&nbsp;:
                  </Text>
                  <Text fontSize="zeta">
                    <Text as="b">{formatNumber(effectifs?.total.apprentis)}</Text> apprentis
                  </Text>
                  <Text fontSize="zeta">
                    <Text as="b">{formatNumber(effectifs?.total.inscritsSansContrat)}</Text> en formation sans contrat
                  </Text>
                  <Text fontSize="zeta">
                    <Text as="b">{formatNumber(effectifs?.total.rupturants)}</Text> rupturants
                  </Text>
                </Box>
              </HStack>
            </Center>
            {!isReady && (
              <Center h="100%" w="100%">
                <Spinner thickness="4px" speed="0.65s" emptyColor="gray.200" color="blue.400" size="xl" />
              </Center>
            )}
            <Center h="100%" w="100%" p="8">
              {isReady && (
                <CarteFrance
                  donneesAvecDepartement={effectifs.parDepartement}
                  dataKey="apprenants"
                  minColor="#DDEBFB"
                  maxColor="#366EC1"
                  tooltipContent={(indicateurs) =>
                    indicateurs ? (
                      <>
                        <Box>Apprenants&nbsp;: {indicateurs.apprenants}</Box>
                        <Box>Apprentis&nbsp;: {indicateurs.apprentis}</Box>
                        <Box>Jeunes en formation sans contrat&nbsp;: {indicateurs.inscritsSansContrat}</Box>
                        <Box>Rupturants&nbsp;: {indicateurs.rupturants}</Box>
                        <Box>Sorties d’apprentissage&nbsp;: {indicateurs.abandons}</Box>
                      </>
                    ) : (
                      <Box>Données non disponibles</Box>
                    )
                  }
                />
              )}
            </Center>
          </Stack>
        </GridItem>
      </Grid>

      <HStack mt="4" justifyContent="end">
        <LockFill color="bluefrance" boxSize="4" />
        <Text>
          Pour visualiser l’intégralité des données consultables,{" "}
          <Link
            href="/auth/connexion"
            plausibleGoal="clic_homepage_connexion_carto"
            borderBottom="1px solid"
            _hover={{ textDecoration: "none" }}
          >
            connectez-vous
          </Link>{" "}
          ou{" "}
          <Link
            href="/auth/inscription"
            plausibleGoal="clic_homepage_inscription_carto"
            borderBottom="1px solid"
            _hover={{ textDecoration: "none" }}
          >
            créez un compte
          </Link>
          .
        </Text>
      </HStack>
    </Container>
  );
}

export default function Home() {
  const { auth } = useAuth();
  return auth ? <DashboardPage /> : <PublicLandingPage />;
}
