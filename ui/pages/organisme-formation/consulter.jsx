import React from "react";
import Head from "next/head";
import { Box, Divider, Heading, HStack, Text } from "@chakra-ui/react";

import { Page, Section } from "../../components";
import { Breadcrumb } from "@/components/Breadcrumb/Breadcrumb";
import Link from "@/components/Links/Link";

import OrganismeFormationPagesMenu from "@/modules/organisme-formation/OrganismeFormationPagesMenu";
import CheckCfaTransmissionContent from "@/modules/organisme-formation/CheckCfaTransmission/CheckCfaTransmissionContent";

export default function CommentConsulterEtVerifierLesDonnees() {
  const title = "Comment vérifier les données que vous transmettez ?";
  return (
    <Page>
      <Head>
        <title>{title}</title>
      </Head>
      <Section>
        <Breadcrumb
          pages={[
            { title: "Accueil", to: "/" },
            { title: "Vous êtes un organisme de formation", to: "/organisme-formation" },
            { title: title },
          ]}
        />
        <Box paddingTop="5w" marginBottom="10w">
          <HStack spacing={["0", "0", "0", "0", "4w"]} flexDirection={["column", "column", "column", "column", "row"]}>
            <Box alignSelf="flex-start" width="100%">
              <OrganismeFormationPagesMenu />
            </Box>
            <Divider
              height="250px"
              orientation="vertical"
              alignSelf="flex-start"
              display={["none", "none", "none", "0", "inline-block"]}
            />
            <Box marginLeft={["0", "0", "0", "0", "5w"]} pb="6w">
              <Box color="grey.800" fontSize="gamma" marginY={["4w", "4w", "4w", "4w", "0"]}>
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
                <Box marginTop="2w" padding="4w" border="1px solid" borderColor="bluefrance">
                  <CheckCfaTransmissionContent />
                </Box>
              </Box>
            </Box>
          </HStack>
        </Box>
      </Section>
    </Page>
  );
}
