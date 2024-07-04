import { Text, Container, HStack, Heading, VStack, List, ListItem, Grid, Box, GridItem, Flex } from "@chakra-ui/react";
import router from "next/router";
import { useCallback, useMemo } from "react";

import Button from "@/components/buttons/Button";
import Link from "@/components/Links/Link";
import { BasicModal } from "@/components/Modals/BasicModal";
import SimplePage from "@/components/Page/SimplePage";
import Ribbons from "@/components/Ribbons/Ribbons";
import SecondarySelectButton from "@/components/SelectButton/SecondarySelectButton";
import { InfoTooltip } from "@/components/Tooltip/InfoTooltip";
import DownloadSimple from "@/theme/components/icons/DownloadSimple";

import FiltreOrganismeTerritoire from "../indicateurs/filters/FiltreOrganismeTerritoire";
import {
  convertEffectifsFiltersToQuery,
  DateFilters,
  parseTerritoireFiltersFromQuery,
  TerritoireFilters,
} from "../models/effectifs-filters";

function VoeuxAffelnetPage() {
  const filters = useMemo(() => parseTerritoireFiltersFromQuery(router.query), [router.query, router.isReady]);

  const onFilterChange = useCallback(
    (update: Partial<TerritoireFilters & DateFilters>) => {
      router.push(
        {
          pathname: router.pathname,
          query: convertEffectifsFiltersToQuery({ ...filters, ...update }),
        },
        undefined,
        { shallow: true }
      );
    },
    [filters]
  );

  return (
    <SimplePage title="Mes vœux Affelnet">
      <Container maxW="xl" p="8">
        <VStack spacing={8} alignItems="start">
          <Heading as="h1" color="#465F9D" fontSize="beta" fontWeight="700">
            Vœux Affelnet 2024
          </Heading>
          <HStack spacing={8}>
            <VStack alignItems="start" w="100%">
              <Text>
                Retrouvez ci-dessous les <strong>124 000</strong> vœux formulés en 2024 via la plateforme Affelnet
                (offre post-3ème).
              </Text>
              <Text as="i">
                Source :{" "}
                <Link
                  variant="link"
                  display="inline-flex"
                  href="https://affectation3e.phm.education.gouv.fr/pna-public/"
                  isExternal
                >
                  Affelnet
                </Link>
              </Text>
            </VStack>
          </HStack>
          <Ribbons title="Vœux Affelnet" variant="info">
            <Text color="black">La mise à disposition de ces chiffres vous permet de :</Text>
            <List my={3} style={{ color: "black", listStyleType: "disc", paddingLeft: "1.5rem" }}>
              <ListItem>
                Quantifier, dans votre territoire, le taux d’insertion en apprentissage à partir du collège/lycée.
              </ListItem>
              <ListItem>
                Visualiser le nombre de jeunes n’ayant pas concrétisé leurs vœux en apprentissage (refusés dans tous les
                CFA pour lesquels ils ont candidaté).
              </ListItem>
              <ListItem>Pouvoir contacter ces jeunes.</ListItem>
            </List>
          </Ribbons>
          <Heading as="h4" size="md">
            En 2024
          </Heading>
          <HStack spacing={8}>
            <Text>Filtrer par</Text>
            <FiltreOrganismeTerritoire
              value={{
                regions: filters.organisme_regions,
                departements: filters.organisme_departements,
                academies: filters.organisme_academies,
                bassinsEmploi: filters.organisme_bassinsEmploi,
              }}
              onRegionsChange={(organisme_regions) => onFilterChange({ organisme_regions })}
              onDepartementsChange={(organisme_departements) => onFilterChange({ organisme_departements })}
              onAcademiesChange={(organisme_academies) => onFilterChange({ organisme_academies })}
              onBassinsEmploiChange={(organisme_bassinsEmploi) => onFilterChange({ organisme_bassinsEmploi })}
              button={({ isOpen, setIsOpen, buttonLabel }) => (
                <SecondarySelectButton onClick={() => setIsOpen(!isOpen)} isActive={isOpen}>
                  {buttonLabel}
                </SecondarySelectButton>
              )}
            />
          </HStack>
          <Grid templateColumns="repeat(4, 1fr)" templateRows="repeat(2, 1fr)" height="250px" gap={4} mx="auto">
            <GridItem colSpan={1} rowSpan={2} bg="galt" borderBottomWidth={4} borderBottomColor="#C2B24C" p={4}>
              <Box p={4}>
                <Box className="ri-heart-fill ri-lg" color="#C2B24C" boxSize={6} />
                <Text fontSize="2xl" fontWeight="bold">
                  124 000
                </Text>
                <Flex alignItems="center" gap={3}>
                  <Text>
                    vœux en apprentissage ont été formulés{" "}
                    <InfoTooltip
                      headerComponent={() => <Text>Vœux en apprentissage formulés en 2024</Text>}
                      contentComponent={() => (
                        <>
                          <Text>
                            Il s’agit du nombre de vœux formulés sur l’année 2024, en cumulés sur les 3 fichiers globaux
                            :
                          </Text>
                          <List my={3} style={{ color: "black", listStyleType: "disc", paddingLeft: "1.5rem" }}>
                            <ListItem>29 mai : tous les vœux</ListItem>
                            <ListItem>
                              7 juin : avancée des vœux. Certains vœux peuvent se rajouter si les jeunes n’ont pas eu le
                              temps de se déclarer
                            </ListItem>
                            <ListItem>
                              Début juillet : fin de validation des vœux. Source : Plateforme des voeux (DNE)
                            </ListItem>
                          </List>
                        </>
                      )}
                    />
                  </Text>
                </Flex>
              </Box>
            </GridItem>
            <GridItem colSpan={1} rowSpan={2} bg="galt" borderBottomWidth={4} borderBottomColor="#4F9D91" p={4}>
              <Box p={4}>
                <Box className="ri-user-fill ri-lg" color="#4F9D91" boxSize={6} />
                <Text fontSize="2xl" fontWeight="bold">
                  83 000
                </Text>
                <Text>jeunes ont formulé au moins un vœu en apprentissage</Text>
              </Box>
            </GridItem>
            <GridItem colSpan={2} bg="galt" borderBottomWidth={4} borderBottomColor="#FA7659">
              <Box p={4} height="full">
                <Flex alignItems="center" gap={2}>
                  <Box className="ri-user-shared-fill ri-lg" color="#FA7659" />
                  <Text fontSize="2xl" fontWeight="bold">
                    4 200
                  </Text>
                </Flex>
                <Flex alignItems="center" gap={2}>
                  <Text>d’entre eux n’ont pas concrétisé ce vœu</Text>
                  <InfoTooltip
                    headerComponent={() => <Text>Calcul des vœux en apprentissage non concrétisés</Text>}
                    contentComponent={() => (
                      <Text>
                        Ce chiffre expose le nombre de jeunes ayant formulé au moins un vœu mais qui n’en ont, à la date
                        du jour, concrétisé aucun (pour différentes raisons : refus, retour en voie scolaire, etc...).
                      </Text>
                    )}
                  />
                  <BasicModal
                    renderTrigger={(onOpen) => (
                      <Button
                        variant="link"
                        action={() => Promise.resolve()}
                        onClick={(e) => {
                          e.preventDefault();
                          onOpen();
                        }}
                        p={0}
                      >
                        Télécharger la liste
                        <DownloadSimple ml={2} />
                      </Button>
                    )}
                    title="Téléchargement de la liste des jeunes n’ayant pas concrétisé leur vœu en apprentissage"
                    size="4xl"
                  >
                    <Flex flexDirection="column" gap={6}>
                      <Text>
                        La liste est nominative et au format Excel : elle contient les contacts des jeunes n’ayant pas
                        concrétisé leur vœu en apprentissage. Une colonne est dédié au nombre de vœux exprimés pour
                        chaque jeune.
                      </Text>
                      <Text>
                        Veuillez noter qu’il est impossible de restituer, pour chaque jeune, si il est retourné en voie
                        scolaire ou si ses vœux en apprentissage ont été refusés.
                      </Text>
                      <Flex justifyContent="flex-end">
                        <Button variant="primary" action={() => Promise.resolve()} isLoading={false}>
                          Télécharger la liste
                          <DownloadSimple ml={2} />
                        </Button>
                      </Flex>
                    </Flex>
                  </BasicModal>
                </Flex>
              </Box>
            </GridItem>
            <GridItem colSpan={2} bg="galt" borderBottomWidth={4} borderBottomColor="#FCC63A">
              <Box p={4} height="full">
                <Flex alignItems="center" gap={2}>
                  <Box className="ri-user-heart-fill ri-lg" color="#FCC63A" />
                  <Text fontSize="2xl" fontWeight="bold">
                    15 000
                  </Text>
                </Flex>
                <Flex alignItems="center" gap={2}>
                  <Text>d’entre eux sont déjà inscrits en CFA pour la rentrée</Text>
                  <InfoTooltip
                    headerComponent={() => <Text>Calcul des jeunes déjà inscrits en CFA</Text>}
                    contentComponent={() => (
                      <>
                        <Text>Ce chiffre se base à la fois sur :</Text>
                        <List my={3} style={{ color: "black", listStyleType: "disc", paddingLeft: "1.5rem" }}>
                          <ListItem>
                            les transmissions d’effectifs au Tableau de bord par les OFA qui ont des jeunes inscrits sur
                            2024-2025
                          </ListItem>
                          <ListItem>
                            la{" "}
                            <Link
                              variant="link"
                              href="https://mesdemarches.emploi.gouv.fr/identification/login?TARGET=https%3A%2F%2Fdeca.alternance.emploi.gouv.fr%3A443%2Fdeca-app%2F"
                              isExternal
                            >
                              base DECA
                            </Link>{" "}
                            (pour ceux ayant signé un contrat)
                          </ListItem>
                        </List>
                        <Text>Ce chiffre n’est pas exhaustif.</Text>
                        <Text>Retrouvez la liste des jeunes dans votre onglet “Mes indicateurs”.</Text>
                      </>
                    )}
                  />
                </Flex>
              </Box>
            </GridItem>
          </Grid>
        </VStack>
      </Container>
    </SimplePage>
  );
}

export default VoeuxAffelnetPage;
