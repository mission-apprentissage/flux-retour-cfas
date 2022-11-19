import React from "react";
import Head from "next/head";
import { Box, Container, Divider, Heading, HStack, Text } from "@chakra-ui/react";

import { Page } from "../../components";
import { Breadcrumb } from "../../components/Breadcrumb/Breadcrumb";
import Link from "../../components/Links/Link";

import OrganismeFormationPagesMenu from "../../modules/organisme-formation/OrganismeFormationPagesMenu";
import CheckCfaTransmissionContent from "../../modules/organisme-formation/CheckCfaTransmission/CheckCfaTransmissionContent";

export default function CommentConsulterEtVerifierLesDonnees() {
  const title = "Comment vérifier les données que vous transmettez ?";
  return (
    <Page>
      <Head>
        <title>{title}</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Box w="100%" pt={[4, 6]} px={[1, 1, 6, 8]}>
        <Container maxW="xl">
          <Breadcrumb
            pages={[
              { title: "Accueil", to: "/" },
              { title: "Vous êtes un organisme de formation", to: "/organisme-formation" },
              { title: title },
            ]}
          />
          <Box w="100%" paddingTop="5w" marginBottom="10w">
            <HStack spacing="10w">
              <Box alignSelf="flex-start" width="34%">
                <OrganismeFormationPagesMenu />
              </Box>
              <Divider height="250px" orientation="vertical" marginLeft="5w" alignSelf="flex-start" />
              <Box>
                <Box w="100%" color="grey.800" fontSize="gamma">
                  <Heading as="h1" fontSize="alpha">
                    Comment consulter et vérifier les données que vous transmettez ?
                  </Heading>
                  <Text marginTop="3w">
                    Vous pouvez accéder sur le Tableau de bord de l’apprentissage, à
                    <strong>
                      {" "}
                      une page dédiée à votre organisme de formation via une URL unique disponible dans votre ERP (ou
                      logiciel de gestion)
                    </strong>
                    . Cette URL est privée, ne la partagez qu’avec les personnes gestionnaires de votre organisme de
                    formation.
                    <Link color="bluefrance" fontWeight="bold" href="/organisme-formation/aide">
                      {" "}
                      Pour plus d’informations, consultez la rubrique d’aide.
                    </Link>
                  </Text>
                  <Heading as="h1" fontSize="alpha" marginTop="4w">
                    Comment consulter et vérifier les données que vous transmettez ?
                  </Heading>
                  <Text marginTop="2w">Renseigner les informations suivantes pour vérifier la transmission :</Text>
                  <Box marginTop="2w" padding="4w" paddingBottom="15w" border="1px solid" borderColor="bluefrance">
                    <CheckCfaTransmissionContent />
                  </Box>
                </Box>
              </Box>
            </HStack>
          </Box>
        </Container>
      </Box>
    </Page>
  );
}
