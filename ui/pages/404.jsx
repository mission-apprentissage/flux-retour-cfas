import { Box, Center, Container, Heading, Link, Stack, Text } from "@chakra-ui/react";
import React from "react";

import { Page } from "../components";
import { NAVIGATION_PAGES } from "../common/constants/navigationPages";
import { NotFound } from "../theme/components/icons";
import Head from "next/head";

const Page404 = () => {
  const title = "404";
  return (
    <Page>
      <Head>
        <title>{title}</title>
      </Head>
      <Box w="100%" pt={[4, 8]} px={[1, 1, 6, 8]} color="grey.800" paddingY="4w">
        <Container maxW="xl">
          <Center>
            <Box width="769px" border="1px solid" borderColor="#E3E3FD" padding="4w" marginTop="6w">
              <Stack alignItems="center" spacing="4w">
                <NotFound />
                <Heading fontSize="28px" fontWeight="bold">
                  Page non trouvée
                </Heading>
                <Text color="grey.800" fontSize="zeta" marginBottom="2w">
                  La page que vous recherchez n’existe pas ou a été déplacée
                </Text>

                <Link
                  href={NAVIGATION_PAGES.Accueil.path}
                  _hover={{ textDecoration: "none", color: "grey.800", background: "galt" }}
                  color="bluefrance"
                >
                  <Box as="i" className="ri-arrow-left-line" marginRight="1w" verticalAlign="middle" />
                  <Box as="span" verticalAlign="middle">
                    Retourner à la page d&apos;accueil
                  </Box>
                </Link>
              </Stack>
            </Box>
          </Center>
        </Container>
      </Box>
    </Page>
  );
};

export default Page404;
