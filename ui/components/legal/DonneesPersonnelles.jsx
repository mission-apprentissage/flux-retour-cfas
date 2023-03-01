import React from "react";
import { Box, Heading, Text, Flex, HStack, Link } from "@chakra-ui/react";
import Sommaire from "../Sommaire/Sommaire";
import Section from "../Section/Section";
import { NAVIGATION_PAGES } from "../../common/constants/navigationPages";
import { PRODUCT_NAME_TITLE } from "../../common/constants/product";

const DonneesPersonnelles = () => {
  const currentPage = NAVIGATION_PAGES.DonneesPersonnelles;
  const title = PRODUCT_NAME_TITLE;

  return (
    <Box pt="4w" pb={16}>
      <HStack
        spacing={["0", "0", "0", "6w"]}
        flexDirection={["column", "column", "column", "row"]}
        alignItems={["normal", "normal", "normal", "center"]}
      >
        <Sommaire>
          <Flex flexDirection="column" fontSize="zeta">
            <Link padding="1w" href="#mission" _hover={{ textDecoration: "none", bg: "grey.200" }}>
              <Text>
                <Text as="span" fontWeight="700">
                  1.
                </Text>{" "}
                La mission d’intérêt public
              </Text>
            </Link>
            <Link padding="1w" href="#finalite" _hover={{ textDecoration: "none", bg: "grey.200" }}>
              <Text marginTop="1w">
                <Text as="span" fontWeight="700">
                  2.
                </Text>{" "}
                Faciliter le pilotage opérationnel de l’apprentissage
              </Text>
            </Link>
            <Link padding="1w" href="#minimisation" _hover={{ textDecoration: "none", bg: "grey.200" }}>
              <Text marginTop="1w">
                <Text as="span" fontWeight="700">
                  3.
                </Text>{" "}
                Minimisation des données
              </Text>
            </Link>
          </Flex>
        </Sommaire>
        {/* Block Mission Intérêt public */}
        <Box>
          <Section>
            <Heading as="h1" marginBottom="1w">
              Protection des données à caractère personnel
            </Heading>
            <Text fontSize="gamma" color="black">
              Le tableau de bord de l’apprentissage est{" "}
              <strong>
                construit dans le respect de la vie privée des personnes et applique les standards de sécurité de
                l&apos;État.
              </strong>
            </Text>
          </Section>
          <Section id={currentPage.anchors.missionInteretPublic} marginTop="5w">
            <Box color="#009081">
              <Text fontSize="gamma" fontWeight="700">
                Base légale
              </Text>
              <Text fontSize="beta" fontWeight="700" id="mission">
                La mission d&apos;intérêt public
              </Text>
            </Box>
            <Box marginTop="1w">
              <Text fontSize="epsilon" color="grey.800">
                Il existe plusieurs bases légales pour fonder un traitement de données à caractère personnel :
              </Text>
              <Box as="ul" paddingLeft="2w" fontSize="epsilon" color="grey.800">
                <li>Le consentement des personnes ;</li>
                <li>Une obligation légale ;</li>
                <li>L’existence d’un contrat ;</li>
                <li>Une mission d’intérêt public, etc...</li>
              </Box>
              <Text paddingY="2w" fontSize="epsilon" color="grey.800">
                C’est sur cette dernière base légale que se fonde notre traitement. En effet, la Mission a accès à
                certaines données à caractère personnel (état civil, coordonnées, code formation, statut inscrit,
                apprenti, ou abandon) enregistrées dans les systèmes de gestion des CFA pour les années n et n-1, afin
                de proposer des nouveaux services, de réaliser des études de cohorte et des analyses de données pour
                améliorer la qualité du service public rendu.
              </Text>
              <Text fontSize="epsilon" color="grey.800">
                Le traitement de collecte des données relatives aux candidats à l’apprentissage et aux apprentis
                s’inscrit dans une mission d’intérêt public décrite dans le cadre de la mission Houzel. Cette mission
                Houzel fait l’objet de deux lettres en date du 10 septembre 2019 puis du 25 février 2020, mais aussi de
                deux décisions du gouvernement en date du 26 novembre 2019 et du 15 octobre 2020.
              </Text>
            </Box>
          </Section>
          {/* Block Faciliter le pilotage */}
          <Section id={currentPage.anchors.faciliterPilotage} mt="10w">
            <Box color="#009099">
              <Text fontSize="gamma" fontWeight="700" id="finalite">
                Finalité
              </Text>
              <Text fontSize="beta" fontWeight="700">
                Faciliter le pilotage opérationnel de l&apos;apprentissage
              </Text>
            </Box>
            <Box marginTop="1w">
              <Text fontSize="epsilon" color="grey.800">
                Le {title} vise à mettre à disposition de toutes les parties prenantes de la formation en apprentissage
                les données clés, de manière dynamique, afin de permettre un pilotage opérationnel réactif dans les
                territoires.
              </Text>
              <Text paddingY="2w" fontSize="epsilon" color="grey.800">
                L’affichage des données en temps réel auprès des acteurs institutionnels leur permet :
              </Text>
              <Box as="ul" paddingLeft="2w" fontSize="epsilon" color="grey.800">
                <li>
                  <strong>D&apos;avoir une tendance de l’évolution</strong> du nombre d’apprentis ;
                </li>
                <li>
                  <strong>De dénombrer et identifier les CFAs</strong> dans lesquels des jeunes sont en recherche de
                  contrat ou en risque de décrochage ;
                </li>
                <li>
                  <strong>D&apos;évaluer l’impact</strong> des plans d’actions régionaux.
                </li>
              </Box>
            </Box>
          </Section>

          {/* Block Minimisation des données */}
          <Section id={currentPage.anchors.minimisationDonnees} mt="10w">
            <Box color="#465F9D">
              <Text fontSize="gamma" fontWeight="700">
                Données collectées
              </Text>
              <Text fontSize="beta" fontWeight="700" id="minimisation">
                Minimisation des données
              </Text>
            </Box>
            <Box marginTop="1w" marginBottom="15w">
              <Text marginBottom="2w" fontSize="epsilon" color="grey.800">
                Dans le respect du RGPD, seules les données utiles à la construction du {title} sont collectées.
              </Text>
              <Text fontSize="epsilon" color="grey.800">
                Données concernant l’apprenant :
              </Text>
              <Box as="ul" marginBottom="2w" paddingLeft="2w" fontSize="epsilon" color="grey.800">
                <li>
                  <strong>Identification</strong> : nom, prénom, date de naissance, tel, e-mail, Code Insee résidence,
                  INE ;
                </li>
                <li>
                  <strong>Formation suivie</strong> : Code Formation Diplôme, RNCP, libellé, période de la formation,
                  année dans la formation, année scolaire, date début de formation ;
                </li>
                <li>
                  <strong>Le statut de l’apprenant</strong> : apprenti, inscrit sans contrat, rupturant, abandon
                </li>
              </Box>
              <Text fontSize="epsilon" color="grey.800">
                Données concernant l’organisme :
              </Text>
              <Box as="ul" marginBottom="2w" paddingLeft="2w" fontSize="epsilon" color="grey.800">
                <li>
                  <strong>Identification</strong> : UAI, SIRET, Nom, Code Insee CFA Formateur
                </li>
              </Box>
              <Text fontSize="epsilon" color="grey.800">
                Données concernant le contrat d&apos;apprentissage :
              </Text>
              <Box as="ul" paddingLeft="2w" fontSize="epsilon" color="grey.800">
                <li>Date de début et date de fin</li>
              </Box>
            </Box>
          </Section>
        </Box>
      </HStack>
    </Box>
  );
};

export default DonneesPersonnelles;
