import React from "react";
import Head from "next/head";
import { Box, Container, Heading, HStack, Link, List, ListItem, Text } from "@chakra-ui/react";

import { ERPS } from "../../common/constants/erps";
import { NAVIGATION_PAGES } from "../../common/constants/navigationPages";
import { CONTACT_ADDRESS } from "../../common/constants/product";

import { LinkCard, Page } from "../../components";
import { Breadcrumb } from "../../components/Breadcrumb/Breadcrumb";
import { Checkbox } from "../../theme/components/icons";
import AcquisitionCfaBarGraph from "../../modules/organisme-formation/AcquisitionCfaBarGraph";

export default function OrganismeFormation() {
  const title = "Vous êtes un organisme de formation";
  return (
    <Page>
      <Head>
        <title>{title}</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Box w="100%" pt={[4, 6]} px={[1, 1, 6, 8]}>
        <Container maxW="xl">
          <Breadcrumb pages={[{ title: "Accueil", to: "/" }, { title: title }]} />
          <Heading textStyle="h2" color="grey.800" mt={5}>
            Vous êtes un organisme de formation
          </Heading>

          <Box
            w="100%"
            mt={4}
            py={[4, 8]}
            background="galt"
            boxShadow="inset 0px 12px 12px 0px rgba(30, 30, 30, 0.08)"
            color="grey.800"
          >
            <Container maxWidth="xl">
              <Text fontSize="gamma" marginTop="1w">
                Le Tableau de bord de l’Apprentissage expose automatiquement les données <br />
                provenant de votre logiciel de gestion une fois que vous en avez donné <br />
                l’autorisation.
              </Text>
              <HStack spacing="3w" marginTop="2w">
                <LinkCard variant="white" linkHref={NAVIGATION_PAGES.OrganismeFormation.transmettre.path}>
                  Comment transmettre les <br />
                  données de votre organisme ?
                </LinkCard>
                <LinkCard variant="white" linkHref={NAVIGATION_PAGES.OrganismeFormation.consulter.path}>
                  Comment consulter et vérifier les données que vous transmettez ?
                </LinkCard>
                <LinkCard variant="white" linkHref={NAVIGATION_PAGES.QuestionsReponses.path}>
                  Une question ? Besoin d’aide ? <br />
                  Consulter la page d’aide
                </LinkCard>
              </HStack>
            </Container>
          </Box>

          <Box w="100%" py={[4, 8]}>
            <Container maxWidth="xl">
              <Heading as="h3" fontSize="beta">
                Organismes de formation et logiciels de gestion interfacés
              </Heading>
              <Text color="grey.800" marginTop="3w">
                <strong>
                  L&apos;équipe du Tableau de bord travaille conjointement avec les acteurs publics locaux des
                  politiques de l&apos;apprentissage pour faire connaître le Tableau de bord de l’apprentissage sur
                  l&apos;ensemble du territoire.
                </strong>
                <br />
                Parallèlement les développements nécessaires sont menés avec les ERP et pour vous permettre de
                transmettre sans logiciel spécifique. Si votre ERP n&apos;est pas dans la liste ci-dessous ou si vous
                avez des questions,{" "}
                <Link href={`mailto:${CONTACT_ADDRESS}`} color="bluefrance" whiteSpace="nowrap">
                  contactez-nous.
                </Link>
              </Text>

              <HStack spacing="3w" marginTop="6w">
                <Box paddingY="3w" paddingX="4w" background="galt" flex="3">
                  <Heading as="h4" fontSize="gamma">
                    Organismes de formation qui transmettent leurs données
                  </Heading>
                  <Box height="260px">
                    <AcquisitionCfaBarGraph />
                  </Box>
                </Box>
                <Box paddingY="3w" paddingX="4w" background="galt" minWidth="300px" flex="1">
                  <Text color="grey.600" fontWeight="700" fontSize="epsilon">
                    Interfacés
                  </Text>
                  <List marginTop="3v" spacing="1w">
                    {ERPS.map(({ name, state }) => {
                      return (
                        <Box key={name}>
                          {state != "coming" && (
                            <ListItem fontSize="epsilon" color="grey.800" alignItems="center">
                              <Checkbox color="#03053D" />
                              <Text marginLeft="1w" as="span">
                                <strong>
                                  {name}
                                  {state === "ongoing" && <Text as="span"> (en cours)</Text>}
                                </strong>
                              </Text>
                            </ListItem>
                          )}
                        </Box>
                      );
                    })}
                    <Text color="grey.600" fontWeight={700} fontSize="epsilon">
                      À venir :
                    </Text>
                    {ERPS.map(({ name, state }) => {
                      return (
                        <Box key={name}>
                          {state === "coming" && (
                            <ListItem fontSize="epsilon" color="grey.800" alignItems="center" marginLeft="1v">
                              <Checkbox
                                color="white"
                                bg="white"
                                border="2px solid"
                                borderColor="#03053D"
                                borderRadius="20px"
                              />
                              <Text marginLeft="1w" as="span">
                                <strong>{name}</strong>
                              </Text>
                            </ListItem>
                          )}
                        </Box>
                      );
                    })}
                  </List>
                </Box>
              </HStack>
            </Container>
          </Box>
        </Container>
      </Box>
    </Page>
  );
}
