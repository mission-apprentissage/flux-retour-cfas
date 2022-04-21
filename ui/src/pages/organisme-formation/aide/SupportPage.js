import { Box, Divider, Heading, HStack, Stack } from "@chakra-ui/react";
import React from "react";

import { BreadcrumbNav, Page, Section } from "../../../common/components";
import { NAVIGATION_PAGES } from "../../../common/constants/navigationPages";
import OrganismeFormationPagesMenu from "../OrganismeFormationPagesMenu";
import Question from "./Question";
import { questions } from "./questions";

const SupportPage = () => {
  return (
    <Page>
      <Section withShadow paddingTop="3w">
        <BreadcrumbNav
          links={[
            NAVIGATION_PAGES.Accueil,
            NAVIGATION_PAGES.OrganismeFormation,
            NAVIGATION_PAGES.OrganismeFormation.aide,
          ]}
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
              <Stack spacing="3w" marginLeft="-3w" marginTop="3w" maxWidth="1000px">
                {questions.map(({ question, answer }, index) => {
                  return <Question key={index} question={question} answer={answer} />;
                })}
              </Stack>
            </Section>
          </Box>
        </HStack>
      </Section>
    </Page>
  );
};

export default SupportPage;
