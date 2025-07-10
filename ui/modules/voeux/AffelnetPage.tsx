import {
  Text,
  Container,
  HStack,
  Heading,
  VStack,
  List,
  ListItem,
  Grid,
  Box,
  GridItem,
  Flex,
  UnorderedList,
  Link,
} from "@chakra-ui/react";
import { useRouter } from "next/router";
import { useMemo, useState } from "react";
import { AUTRE_AFFELNET_LINK } from "shared";

import { _getBlob } from "@/common/httpClient";
import { downloadObject } from "@/common/utils/browser";
import { formatNumber } from "@/common/utils/stringUtils";
import Button from "@/components/buttons/Button";
import { BasicModal } from "@/components/Modals/BasicModal";
import SimplePage from "@/components/Page/SimplePage";
import Ribbons from "@/components/Ribbons/Ribbons";
import SecondarySelectButton from "@/components/SelectButton/SecondarySelectButton";
import { InfoTooltip } from "@/components/Tooltip/InfoTooltip";
import { useAffelnetCount } from "@/hooks/organismes";
import DownloadSimple from "@/theme/components/icons/DownloadSimple";

import FiltreAffelnetDate from "../indicateurs/filters/FiltreAffelnetDate";

import AffelnetChart from "./AffelnetChart";

function VoeuxAffelnetPage() {
  const router = useRouter();
  const { organisme_departements } = router.query;
  const [affelnetDate, setAffelnetDate] = useState(new Date());
  const { affelnetCount, isLoading } = useAffelnetCount(affelnetDate, organisme_departements);

  const affelnetYear = useMemo(() => {
    return affelnetDate.getFullYear();
  }, [affelnetDate]);

  return (
    <SimplePage title="Mes vœux Affelnet">
      <Container maxW="xl" p="8">
        <VStack spacing={8} alignItems="start">
          <Heading as="h1" color="#465F9D" fontSize="beta" fontWeight="700">
            Vœux Affelnet
          </Heading>
          <HStack spacing={8}>
            <Text>Voir l&apos;année</Text>
            <FiltreAffelnetDate
              value={affelnetDate}
              onChange={(date) => setAffelnetDate(date)}
              button={({ isOpen, setIsOpen }) => (
                <SecondarySelectButton onClick={() => setIsOpen(!isOpen)} isActive={isOpen}>
                  {affelnetYear}
                </SecondarySelectButton>
              )}
            />
          </HStack>
          <HStack spacing={8}>
            <VStack alignItems="start" w="100%">
              <Text>
                Retrouvez ci-dessous les{" "}
                <strong>{isLoading ? "..." : formatNumber(affelnetCount?.voeuxFormules)}</strong> vœux formulés en{" "}
                {affelnetYear} via la plateforme Affelnet (offre post-3ème).
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
            En {affelnetYear}
          </Heading>
          <Grid templateColumns="repeat(4, 1fr)" templateRows="repeat(3, 1fr)" gap={4} height="290px" mx="auto">
            <GridItem colSpan={1} rowSpan={2} bg="galt" borderBottomWidth={4} borderBottomColor="#C2B24C" p={4}>
              <Box p={4}>
                <Box className="ri-heart-fill ri-lg" color="#C2B24C" boxSize={6} />
                <Text fontSize="2xl" fontWeight="bold">
                  {isLoading ? "..." : formatNumber(affelnetCount?.voeuxFormules)}
                </Text>
                <Flex alignItems="center" gap={3}>
                  <Text>
                    vœux en apprentissage ont été formulés{" "}
                    <InfoTooltip
                      headerComponent={() => <Text>Vœux en apprentissage formulés en {affelnetYear}</Text>}
                      contentComponent={() => (
                        <>
                          <Text>
                            Il s’agit du nombre de vœux formulés sur l’année {affelnetYear}, en cumulé sur les 3
                            fichiers globaux :
                          </Text>
                          <List my={3} style={{ color: "black", listStyleType: "disc", paddingLeft: "1.5rem" }}>
                            <ListItem>29 mai : tous les vœux</ListItem>
                            <ListItem>
                              7 juin : avancée des vœux. Certains vœux peuvent se rajouter si les jeunes n’ont pas eu le
                              temps de se déclarer
                            </ListItem>
                            <ListItem>
                              Début juillet : fin de validation des vœux. Source : Plateforme des vœux (DNE)
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
                  {isLoading ? "..." : formatNumber(affelnetCount?.apprenantVoeuxFormules)}
                </Text>
                <Text>jeunes ont formulé au moins un vœu en apprentissage</Text>
              </Box>
            </GridItem>
            <GridItem colSpan={2} bg="galt" borderBottomWidth={4} borderBottomColor="#FA7659" p={2}>
              <Box p={4} height="full">
                <Flex alignItems="center" gap={2}>
                  <Box className="ri-user-shared-fill ri-lg" color="#FA7659" />
                  <Text fontSize="xl" fontWeight="bold">
                    {isLoading ? "..." : formatNumber(affelnetCount?.apprenantsNonContretise)}
                  </Text>
                </Flex>
                <Flex alignItems="center" gap={2}>
                  <Text>d’entre eux n’ont pas concrétisé ce vœu</Text>
                  <InfoTooltip
                    headerComponent={() => <Text>Calcul des vœux en apprentissage non concrétisés</Text>}
                    contentComponent={() => (
                      <Text>
                        Ce chiffre expose le nombre de jeunes ayant formulé un vœu non concrétisé à ce jour (pour
                        différentes raisons : en recherche de CFA , et/ou en recherche d&apos;un contrat pour valider
                        son inscription).
                      </Text>
                    )}
                  />
                </Flex>
                <Flex>
                  <BasicModal
                    renderTrigger={(onOpen) => (
                      <Button
                        mt="5px"
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
                        La liste est nominative et au format Excel : elle contient 2 onglets avec les contacts des
                        jeunes n’ayant pas concrétisé leur vœu en apprentissage.
                      </Text>
                      <Text>
                        Le premier onglet est dédié aux jeunes qui n’étaient plus présents dans le dernier fichier des
                        vœux Affelnet (transmis le 8 juillet {affelnetYear}) et le deuxième onglet est dédié aux jeunes
                        que l’on ne retrouve pas inscrits en CFA sur le Tableau de bord de l’apprentissage. Dans chaque
                        onglet, une colonne est dédiée au nombre de vœux exprimés pour chaque jeune.
                      </Text>
                      <Text>
                        Veuillez noter qu’il est impossible de restituer, pour chaque jeune, si il est retourné en voie
                        scolaire ou si ses vœux en apprentissage ont été refusés.
                      </Text>
                      <Flex justifyContent="flex-end">
                        <Button
                          variant="primary"
                          action={async () => {
                            const { data } = await _getBlob(
                              `/api/v1/affelnet/export/non-concretise?year=${affelnetYear}`
                            );
                            downloadObject(data, `voeux_affelnet_non_concretise.csv`, "text/plain");
                          }}
                          isLoading={false}
                        >
                          Télécharger la liste
                          <DownloadSimple ml={2} />
                        </Button>
                      </Flex>
                    </Flex>
                  </BasicModal>
                </Flex>
              </Box>
            </GridItem>
            <GridItem colSpan={2} bg="galt" borderBottomWidth={4} borderBottomColor="#FCC63A" p={2}>
              <Box p={4} height="full">
                <Flex alignItems="center" gap={2}>
                  <Box className="ri-user-heart-fill ri-lg" color="#FCC63A" />
                  <Text fontSize="xl" fontWeight="bold">
                    {isLoading
                      ? "..."
                      : formatNumber(
                          (affelnetCount?.apprenantVoeuxFormules ?? 0) - (affelnetCount?.apprenantsNonContretise ?? 0)
                        )}
                  </Text>
                </Flex>
                <Flex alignItems="center" gap={2}>
                  <Text>d’entre eux sont déjà inscrits en CFA pour la rentrée</Text>
                  <InfoTooltip
                    headerComponent={() => (
                      <Text>Calcul des jeunes, avec ou sans contrat d’apprentissage, déjà inscrits en CFA</Text>
                    )}
                    contentComponent={() => (
                      <Flex flexDirection="column" gap={6}>
                        <Text>Ce chiffre se base à la fois sur :</Text>
                        <UnorderedList>
                          <ListItem>
                            les transmissions d’effectifs au Tableau de bord par les OFA qui ont des jeunes inscrits sur
                            2024-2025 (avec ou sans contrat d’apprentissage)
                          </ListItem>
                          <ListItem>
                            la base{" "}
                            <Link
                              variant="link"
                              display="inline-flex"
                              href="https://mesdemarches.emploi.gouv.fr/identification/login?TARGET=https%3A%2F%2Fdeca.alternance.emploi.gouv.fr%3A443%2Fdeca-app%2F"
                              isExternal
                            >
                              DECA
                            </Link>{" "}
                            (pour ceux ayant signé un contrat)
                          </ListItem>
                        </UnorderedList>
                        <Text>
                          Ce chiffre n’est pas exhaustif. Il est mis à jour toutes les semaines (chaque lundi).
                          Retrouvez la liste des jeunes dans votre onglet “Mes indicateurs” (fichier Excel de listes
                          nominatives).
                        </Text>
                      </Flex>
                    )}
                  />
                </Flex>
                <Flex>
                  <Button
                    mt="5px"
                    variant="link"
                    action={async () => {
                      const { data } = await _getBlob(`/api/v1/affelnet/export/concretise?year=${affelnetYear}`);
                      downloadObject(data, `voeux_affelnet_concretise.csv`, "text/plain");
                    }}
                    p={0}
                  >
                    Télécharger la liste
                    <DownloadSimple ml={2} />
                  </Button>
                </Flex>
              </Box>
            </GridItem>
          </Grid>
          <Grid templateColumns="repeat(2, 1fr)" templateRows="repeat(1, 1fr)" gap={4}>
            <GridItem colSpan={1}>
              <AffelnetChart
                totalApprenants={affelnetCount?.apprenantVoeuxFormules}
                apprenantsConcretises={affelnetCount?.apprenantsRetrouves}
              ></AffelnetChart>
            </GridItem>
          </Grid>
          <Flex gap={3}>
            <Text>Vous avez une question / remarque ?</Text>
            <Link variant="link" display="inline-flex" href={AUTRE_AFFELNET_LINK} isExternal>
              Écrivez-nous
              <Box className="ri-arrow-right-line" />
            </Link>
          </Flex>
        </VStack>
      </Container>
    </SimplePage>
  );
}

export default VoeuxAffelnetPage;
