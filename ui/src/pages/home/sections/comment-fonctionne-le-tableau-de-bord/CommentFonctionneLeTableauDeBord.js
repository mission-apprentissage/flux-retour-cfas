import { Box, Flex, Heading, HStack, Tab, TabList, TabPanel, TabPanels, Tabs } from "@chakra-ui/react";
import React from "react";

import { Section } from "../../../../common/components";
import {
  DataVisualisation,
  FranceLocalization,
  InProgress,
  RightArrow,
  RightSideDownArrow,
  RightSideDownTiltArrow,
  RightSideUpArrow,
  RightSideUpTiltArrow,
  Search,
  SendMail,
  SystemSvg,
  TechnicalError,
} from "../../../../theme/components/icons";
import FonctionnementTableauDeBordCard from "./FonctionnementTableauDeBordCard";

const CommentFonctionneLeTableauDeBord = () => {
  return (
    <Section paddingY="4w" bg="grey.100">
      <Heading as="h1" fontSize="alpha">
        Le fonctionnement du Tableau de bord
      </Heading>
      <Tabs variant="primary" marginTop="4w">
        <TabList marginLeft="2w">
          <Tab fontWeight="700">Organismes de formation</Tab>
          <Tab fontWeight="700">Institutuons</Tab>
        </TabList>
        <TabPanels background="white" color="grey.800">
          <TabPanel>
            <Box marginX="4w" fontSize="zeta">
              <HStack>
                <FonctionnementTableauDeBordCard
                  Logo={InProgress}
                  content={
                    <>
                      Je réponds à mon obligation
                      <br /> de <strong>donner de la visibilité</strong> aux pouvoirs publics{" "}
                      <strong>sur mes effectifs</strong> d&apos;apprentissage.
                    </>
                  }
                />
                <RightArrow alignSelf="center" />
                <FonctionnementTableauDeBordCard
                  Logo={Search}
                  content={
                    <>
                      Je renseigne <strong>mon UAI ou mon numéro SIRET</strong> et me laisse guider
                    </>
                  }
                />
                <Flex flexDirection="column">
                  <Flex flexDirection="row">
                    <RightSideUpArrow marginTop="8w" marginRight="1w" />
                    <FonctionnementTableauDeBordCard
                      Logo={SystemSvg}
                      content={
                        <>
                          Si mon organisme dispose d’un outil compatible, je le paramètre pour{" "}
                          <strong>transmettre facilement et automatiquement les effectifs au Tableau de bord</strong>
                        </>
                      }
                    />
                    <RightSideUpTiltArrow marginTop="6w" marginRight="1w" />
                  </Flex>
                  <Box marginTop="1v">
                    <Flex flexDirection="row">
                      <RightSideDownArrow marginTop="6w" marginRight="1w" />
                      <FonctionnementTableauDeBordCard
                        width="40px"
                        height="40px"
                        Logo={DataVisualisation}
                        content={
                          <>
                            Si je n’ai pas d’outil connecté au Tableau de bord, je{" "}
                            <strong>transmets mes données via l’outil Partage Simplifié</strong>
                          </>
                        }
                      />
                      <RightSideDownTiltArrow marginTop="6w" marginRight="1w" />
                    </Flex>
                  </Box>
                </Flex>
                <FonctionnementTableauDeBordCard
                  width="40px"
                  height="40px"
                  Logo={TechnicalError}
                  content={
                    <>
                      Mes données sont <strong>agrégées</strong> et{" "}
                      <strong>accessibles uniquement par les institutions</strong>
                    </>
                  }
                />
              </HStack>
            </Box>
          </TabPanel>
          <TabPanel>
            <Box marginX="4w" fontSize="zeta">
              <HStack spacing="2w">
                <FonctionnementTableauDeBordCard
                  Logo={Search}
                  content={
                    <>
                      Je veux accéder aux <strong>données de l’apprentissage</strong> de mon territoire.
                    </>
                  }
                />
                <RightArrow alignSelf="center" />
                <FonctionnementTableauDeBordCard
                  Logo={Search}
                  content={
                    <>
                      Je fais une{" "}
                      <strong>
                        demande <br />
                        d’identifiants
                      </strong>{" "}
                      au Tableau de bord et les reçois sur ma messagerie.
                    </>
                  }
                />
                <RightArrow alignSelf="center" />
                <FonctionnementTableauDeBordCard
                  Logo={SendMail}
                  content={
                    <>
                      Je me <strong>connecte</strong> et{" "}
                      <strong>
                        visualise en <br />
                        temps réel
                      </strong>{" "}
                      les chiffres-clés des organismes de l’apprentissage sur mon territoire
                    </>
                  }
                />
                <RightArrow alignSelf="center" />
                <FonctionnementTableauDeBordCard
                  Logo={FranceLocalization}
                  content={
                    <>
                      Je pilote la <strong>politique de l’apprentissage</strong> au plus juste de la réalité du terrain.
                    </>
                  }
                />
              </HStack>
            </Box>
          </TabPanel>
        </TabPanels>
      </Tabs>
    </Section>
  );
};

export default CommentFonctionneLeTableauDeBord;
