import { Box, Button, Divider, Heading, HStack, Stack, Text } from "@chakra-ui/react";
import React from "react";

import { NAVIGATION_PAGES } from "../../../common/constants/navigationPages";
import { CONTACT_ADDRESS } from "../../../common/constants/product";
import { BreadcrumbNav, Page, Section } from "../../../components";
import { questions } from "../../../components/_pagesComponents/organismes-formation/questions.js";
import OrganismeFormationPagesMenu from "../OrganismeFormationPagesMenu";
import Question from "./Question";

const SupportPage = () => {
  return (
    <Page>
      <Section withShadow paddingTop="3w">
        <BreadcrumbNav
          links={[NAVIGATION_PAGES.Accueil, NAVIGATION_PAGES.OrganismeFormation, NAVIGATION_PAGES.QuestionsReponses]}
        />
      </Section>
      <Section paddingTop="5w" marginBottom="10w">
        <HStack spacing="10w">
          <Box alignSelf="flex-start" width="34%">
            <OrganismeFormationPagesMenu />
          </Box>
          <Divider height="250px" orientation="vertical" marginLeft="5w" alignSelf="flex-start" />
          <Box paddingX="9w">
            <Section color="grey.800" fontSize="gamma">
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
            </Section>
          </Box>
        </HStack>
      </Section>
    </Page>
  );
};

export default SupportPage;
