import { Box, Heading, HStack, Link, List, ListItem, Text } from "@chakra-ui/react";
import React from "react";

import { ERPS } from "../../common/constants/erps";
import { NAVIGATION_PAGES } from "../../common/constants/navigationPages";
import { CONTACT_ADDRESS } from "../../common/constants/product";
import { BreadcrumbNav, LinkCard, Page, Section } from "../../components";
import { Checkbox } from "../../theme/components/icons";
import AcquisitionCfaBarGraph from "./AcquisitionCfaBarGraph";

const OrganismeFormationPage = () => {
  return (
    <Page>
      <Section
        withShadow
        paddingY="4w"
        background="galt"
        boxShadow="inset 0px 12px 12px 0px rgba(30, 30, 30, 0.08)"
        color="grey.800"
      >
        <BreadcrumbNav links={[NAVIGATION_PAGES.Accueil, NAVIGATION_PAGES.OrganismeFormation]} />
        <Heading as="h1" fontSize="alpha" marginTop="5w">
          Vous êtes un organisme de formation
        </Heading>
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
      </Section>

      <Section paddingY="8w">
        <Heading as="h3" fontSize="beta">
          Organismes de formation et logiciels de gestion interfacés
        </Heading>
        <Text color="grey.800" marginTop="3w">
          <strong>
            L&apos;équipe du Tableau de bord travaille conjointement avec les acteurs publics locaux des politiques de
            l&apos;apprentissage pour faire connaître le Tableau de bord de l’apprentissage sur l&apos;ensemble du
            territoire.
          </strong>
          <br />
          Parallèlement les développements nécessaires sont menés avec les ERP et pour vous permettre de transmettre
          sans logiciel spécifique. Si votre ERP n&apos;est pas dans la liste ci-dessous ou si vous avez des questions,{" "}
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
      </Section>
    </Page>
  );
};

export default OrganismeFormationPage;
