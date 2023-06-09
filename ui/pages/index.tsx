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
  Text,
  Tooltip,
  VStack,
} from "@chakra-ui/react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/router";
import { ReactNode, useMemo, useState } from "react";

import { _get } from "@/common/httpClient";
import { OrganisationType } from "@/common/internal/Organisation";
import { getAuthServerSideProps } from "@/common/SSR/getAuthServerSideProps";
import { formatDate } from "@/common/utils/dateUtils";
import { formatNumber } from "@/common/utils/stringUtils";
import Link from "@/components/Links/Link";
import SimplePage from "@/components/Page/SimplePage";
import useAuth from "@/hooks/useAuth";
import CarteFrance from "@/modules/dashboard/CarteFrance";
import DashboardOrganisme from "@/modules/dashboard/DashboardOrganisme";
import DashboardTransverse from "@/modules/dashboard/DashboardTransverse";
import { TeamIcon } from "@/modules/dashboard/icons";
import { convertEffectifsFiltersToQuery } from "@/modules/models/effectifs-filters";
import { IndicateursEffectifsAvecDepartement } from "@/modules/models/indicateurs";
import { LockFill } from "@/theme/components/icons";

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
      <Center bg="#F5F5FE" color="plaininfo" h="14" fontWeight="bold" lineHeight="1.2em">
        <Image src="/images/landing-cards/info.svg" alt="" userSelect="none" mr="3" />
        Taux de fiabilisation des données exposées sur le tableau de bord&nbsp;: +&nbsp;90%. Si vous constatez des
        erreurs résiduelles, merci de nous le signaler.
      </Center>

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
          </VStack>
          <VStack flex="1" backgroundColor="galt2" p="8">
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
                  Centraliser les informations utiles à l’animation de celui-ci
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
                  <Image src="/images/landing-cards/bar-chart.svg" boxSize="16px" alt="" mr="2" />
                  Visualisez des données ciblées sur votre territoire
                </Flex>
              </ListItem>
              <ListItem>
                <Flex align="center" fontSize="omega">
                  <Image src="/images/landing-cards/alarm-warning.svg" boxSize="16px" alt="" mr="2" />
                  <Text>
                    Mobiliser rapidement le{" "}
                    <Text as="abbr" title="SPIE : Service public de l’insertion et de l’emploi" cursor="help">
                      SPIE
                    </Text>{" "}
                    en cas de difficultés des apprentis
                  </Text>
                </Flex>
              </ListItem>
            </List>
          </VStack>
        </Stack>

        <SectionApercuChiffresCles />
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

      <Container maxW="xl" bg="#FEF9F7" px="14" py="10" my="12">
        <Text fontWeight="bold" color="blue_cumulus_main" fontSize="gamma">
          Suivez nos actualités sur LinkedIn “Mission Interministérielle pour l’apprentissage”
        </Text>
        <Link
          variant="whiteBg"
          mt="4"
          display="inline-flex"
          alignItems="center"
          href="https://fr.linkedin.com/company/mission-apprentissage"
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

interface IndicateursNationalFilters {
  date: Date;
  organisme_regions?: string[];
}

interface IndicateursOrganismesNature {
  total: number;
  responsables: number;
  responsablesFormateurs: number;
  formateurs: number;
}

function SectionApercuChiffresCles() {
  const router = useRouter();
  const [indicateursFilters] = useState<IndicateursNationalFilters>({
    date: new Date(),
  });

  const { data: indicateursNational, isLoading: indicateursNationalLoading } = useQuery<{
    indicateursEffectifs: IndicateursEffectifsAvecDepartement[];
    indicateursOrganismes: IndicateursOrganismesNature;
  }>(
    ["indicateurs/effectifs", JSON.stringify(convertEffectifsFiltersToQuery(indicateursFilters))],
    () =>
      _get("/api/v1/indicateurs/national", {
        params: convertEffectifsFiltersToQuery(indicateursFilters),
      }),
    {
      enabled: router.isReady,
    }
  );

  const indicateursEffectifsNationaux = useMemo(
    () =>
      (indicateursNational?.indicateursEffectifs ?? []).reduce(
        (acc, indicateursDepartement) => {
          acc.apprenants += indicateursDepartement.apprenants;
          acc.apprentis += indicateursDepartement.apprentis;
          acc.inscritsSansContrat += indicateursDepartement.inscritsSansContrat;
          acc.abandons += indicateursDepartement.abandons;
          acc.rupturants += indicateursDepartement.rupturants;
          return acc;
        },
        {
          apprenants: 0,
          apprentis: 0,
          inscritsSansContrat: 0,
          abandons: 0,
          rupturants: 0,
        }
      ),
    [indicateursNational?.indicateursEffectifs]
  );

  return (
    <Container maxW="xl" py="8" px="0">
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
      <Text fontSize="sm" mt="2">
        Le <Text as="b">{formatDate(new Date(), "d MMMM yyyy")}</Text>, le tableau de bord de l’apprentissage recense
        sur le territoire national{" "}
        <Text as="b">{formatNumber(indicateursEffectifsNationaux.apprenants)} apprenants</Text>, dont{" "}
        <Text as="b">{formatNumber(indicateursEffectifsNationaux.apprentis)} apprentis</Text>,{" "}
        <Text as="b">{formatNumber(indicateursEffectifsNationaux.inscritsSansContrat)} jeunes sans contrat</Text> et{" "}
        <Text as="b">{formatNumber(indicateursEffectifsNationaux.rupturants)} rupturants</Text>.
      </Text>

      <HStack mt="4">
        <LockFill color="bluefrance" boxSize="4" />
        <Text>
          Pour visualiser l’intégralité des données consultables,{" "}
          <Link href="/auth/connexion" borderBottom="1px solid" _hover={{ textDecoration: "none" }}>
            connectez-vous
          </Link>{" "}
          ou{" "}
          <Link href="/auth/inscription" borderBottom="1px solid" _hover={{ textDecoration: "none" }}>
            créez un compte
          </Link>
          .
        </Text>
      </HStack>

      <Grid templateColumns="1fr 2fr" gap={4} my={8}>
        <GridItem bg="#F5F5FE">
          <Center h="100%">
            <HStack gap={3} py="10" px="12">
              <Box alignSelf={"start"} pt="3">
                <Image src="/images/landing-cards/community.svg" boxSize="10" alt="" userSelect="none" />
              </Box>
              <Box>
                <Text fontSize="40px" fontWeight="700" color="bluefrance">
                  {formatNumber(indicateursNational?.indicateursOrganismes?.total)}
                </Text>
                <Text fontSize="zeta" fontWeight="700" lineHeight="1em" color="bluefrance">
                  organismes de formation en apprentissage
                  <Tooltip background="bluefrance" color="white" label={<Box padding="1w">TODO</Box>}>
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
                  <Text as="b">{formatNumber(indicateursNational?.indicateursOrganismes?.responsables)}</Text>{" "}
                  responsables
                </Text>
                <Text fontSize="zeta">
                  <Text as="b">{formatNumber(indicateursNational?.indicateursOrganismes?.responsablesFormateurs)}</Text>{" "}
                  responsables et formateurs
                </Text>
                <Text fontSize="zeta">
                  <Text as="b">{formatNumber(indicateursNational?.indicateursOrganismes?.formateurs)}</Text> formateurs
                </Text>
              </Box>
            </HStack>
          </Center>
        </GridItem>

        <GridItem bg="#F5F5FE">
          <HStack>
            <Center h="100%">
              <HStack gap={3} py="10" px="12">
                <Box alignSelf={"start"} pt="3">
                  <TeamIcon fill="bluefrance" />
                </Box>
                <Box>
                  <Text fontSize="40px" fontWeight="700" color="bluefrance">
                    {formatNumber(indicateursEffectifsNationaux?.apprenants)}
                  </Text>
                  <Text fontSize="zeta" fontWeight="700" lineHeight="1em" color="bluefrance">
                    apprenants
                    <Tooltip background="bluefrance" color="white" label={<Box padding="1w">TODO</Box>}>
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
                    <Text as="b">{formatNumber(indicateursEffectifsNationaux?.apprentis)}</Text> apprentis
                  </Text>
                  <Text fontSize="zeta">
                    <Text as="b">{formatNumber(indicateursEffectifsNationaux?.inscritsSansContrat)}</Text> en formation
                    sans contrat
                  </Text>
                  <Text fontSize="zeta">
                    <Text as="b">{formatNumber(indicateursEffectifsNationaux?.rupturants)}</Text> rupturants
                  </Text>
                </Box>
              </HStack>
            </Center>
            {indicateursNationalLoading && (
              <Center h="100%" w="100%">
                <Spinner thickness="4px" speed="0.65s" emptyColor="gray.200" color="blue.400" size="xl" />
              </Center>
            )}
            <Center h="100%" w="100%" p="8">
              {indicateursNational?.indicateursEffectifs && (
                <CarteFrance
                  donneesAvecDepartement={indicateursNational.indicateursEffectifs}
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
          </HStack>
        </GridItem>
      </Grid>
    </Container>
  );
}

export default function Home() {
  const { auth } = useAuth();
  // FIXME vérifier le chargement
  return auth ? <DashboardPage /> : <PublicLandingPage />;
}
