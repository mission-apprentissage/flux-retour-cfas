import { Box, Heading, Stack } from "@chakra-ui/react";
import React from "react";

import { Page, Section } from "../../common/components";
import { NAVIGATION_PAGES } from "../../common/constants/navigationPages";
import Question from "./Question";
import { questions } from "./questions";

const SupportPage = () => {
  return (
    <Page>
      <Box color="grey.800">
        <Section backgroundColor="galt" paddingY="8w" withShadow>
          <Heading as="h1" variant="h1" marginBottom="1w">
            {NAVIGATION_PAGES.Support.title}
          </Heading>
        </Section>
        <Section paddingY="4w">
          <Stack spacing="3w">
            {questions.map(({ question, answer }, index) => {
              return <Question key={index} question={question} answer={answer} />;
            })}
          </Stack>
        </Section>
      </Box>
    </Page>
  );
};

export default SupportPage;
