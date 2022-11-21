import React from "react";
import Head from "next/head";
import { Box, Button, Container, Divider, Heading, HStack, Stack, Text } from "@chakra-ui/react";

import { Page, Section } from "../../components";
import { CONTACT_ADDRESS } from "../../common/constants/product";
import OrganismeFormationPagesMenu from "../../modules/organisme-formation/OrganismeFormationPagesMenu";
import Question from "../../modules/organisme-formation/aide/Question";
import { questions } from "../../modules/organisme-formation/aide/questions";
import { Breadcrumb } from "../../components/Breadcrumb/Breadcrumb";

// OrganismeFormation: {
//   path: "/organisme-formation",
//   title: "Vous êtes un organisme de formation",
//   transmettre: {
//     path: "/organisme-formation/transmettre",
//     title: "Comment transmettre les données de votre organisme ?",
//   },

export default function Aide() {
  const title = "Page d'aide";
  return (
    <Page>
      <Head>
        <title>{title}</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Section>
        <Breadcrumb
          pages={[
            { title: "Accueil", to: "/" },
            { title: "Vous êtes un organisme de formation", to: "/organisme-formation" },
            { title: title },
          ]}
        />
        <Heading textStyle="h2" color="grey.800" mt={5}>
          {title}
        </Heading>
        <HStack spacing="10w">
          <Box alignSelf="flex-start" width="34%">
            <OrganismeFormationPagesMenu />
          </Box>
          <Divider height="250px" orientation="vertical" marginLeft="5w" alignSelf="flex-start" />
          <Box paddingX="9w">
            <Container maxW="xl" color="grey.800" fontSize="gamma">
              <Heading as="h1" fontSize="alpha">
                Page d&apos;aide
              </Heading>
              <Stack spacing="3w" marginLeft="-3w" marginBottom="3w" marginTop="3w" maxWidth="1000px">
                {questions.map(({ question, answer }, index) => {
                  return <Question key={index} question={question} answer={answer} />;
                })}
              </Stack>
              <Text marginBottom="3w">
                Vous ne trouvez pas la réponse à votre question ou vous avez besoin de contacter notre équipe ?
              </Text>
              <a href={`mailto:${CONTACT_ADDRESS}`}>
                <Button variant="primary">Contactez le support du Tableau de bord de l&apos;apprentissage</Button>
              </a>
            </Container>
          </Box>
        </HStack>
      </Section>
    </Page>
  );
}
