import { Box, Heading, HStack, List, ListItem, Text } from "@chakra-ui/react";
import React from "react";

import { AppHeader, Badge, BreadcrumbNav, LinkCard, Section } from "../../common/components";
import ContactSection from "../../common/components/ContactSection/ContactSection";
import { ERP_STATE_COLOR, ERPS } from "../../common/constants/erps";
import { navigationPages } from "../../common/constants/navigationPages";
import AcquisitionCfaBarGraph from "./AcquisitionCfaBarGraph";

const TransmettreConsulterVosDonneesPage = () => {
  return (
    <>
      <AppHeader />

      <Section paddingY="4w" background="galt" boxShadow="inset 0px 12px 12px 0px rgba(30, 30, 30, 0.08)">
        <BreadcrumbNav links={[navigationPages.Accueil, navigationPages.TransmettreEtConsulterVosDonnees]} />
        <Heading as="h1" fontSize="alpha" color="grey.800" marginTop="5w">
          Transmettre et consulter vos données
        </Heading>
        <Text fontSize="gamma" marginTop="2w" color="grey.800" fontWeight="700">
          Vous êtes un organisme de formation
        </Text>
        <HStack spacing="3w" marginTop="2w">
          <LinkCard linkText="Transmettre vos données" linkHref="/login">
            <strong>Vous ne transmettez pas encore vos données</strong> au tableau de bord
          </LinkCard>
          <LinkCard linkText="Consulter vos données" linkHref="/">
            <strong>Vous transmettez déjà vos données</strong> au tableau de bord
          </LinkCard>
        </HStack>
      </Section>

      <Section paddingY="8w">
        <Heading as="h3" fontSize="beta">
          Pourquoi transmettre vos données au tableau de bord ?
        </Heading>
        <Text color="grey.800" marginTop="3w">
          Différentes institutions (Conseil régionaux, DREETS, Opco, etc.) consultent le tableau de bord quotidiennement
          pour suivre l’évolution des effectifs.&nbsp;
          <strong>
            Elles se servent de ces données pour évaluer les montants des aides aux organismes de formation et pour
            mettre en place des plans d’actions.
          </strong>
        </Text>

        <HStack spacing="3w" marginTop="6w" alignItems="flex-start" height="400px">
          <Box paddingY="3w" paddingX="4w" background="galt" flex="3" height="100%">
            <Heading as="h4" fontSize="gamma">
              Organismes de formation qui transmettent leurs données
            </Heading>
            <Text fontWeight="700" fontSize="alpha" color="grey.800">
              1 835
            </Text>
            <Box height="260px">
              <AcquisitionCfaBarGraph />
            </Box>
          </Box>
          <Box paddingY="3w" paddingX="4w" background="galt" minWidth="300px" flex="1" height="100%">
            <Text color="grey.800" fontWeight="700" fontSize="gamma">
              Aujourd&apos;hui le tableau de bord est interfaçable avec :
            </Text>
            <List marginTop="3v" spacing="1w">
              {ERPS.map(({ name, state }) => {
                return (
                  <ListItem color="grey.800" fontWeight="700" key={name} display="flex" alignItems="center">
                    <Box
                      background={ERP_STATE_COLOR[state]}
                      height="12px"
                      width="12px"
                      borderRadius="50%"
                      marginRight="1w"
                    />
                    {name}
                  </ListItem>
                );
              })}
            </List>
            <HStack spacing="2w" marginTop="6w">
              <Badge backgroundColor={ERP_STATE_COLOR.ready}>opérationnel</Badge>
              <Badge backgroundColor={ERP_STATE_COLOR.ongoing}>en cours</Badge>
              <Badge backgroundColor={ERP_STATE_COLOR.coming}>à venir</Badge>
            </HStack>
          </Box>
        </HStack>
      </Section>

      <ContactSection />
    </>
  );
};

export default TransmettreConsulterVosDonneesPage;
