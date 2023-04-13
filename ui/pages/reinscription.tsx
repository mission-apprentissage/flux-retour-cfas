import { Box, Button, Center, Container, Heading, Stack, Text } from "@chakra-ui/react";
import React from "react";
import Head from "next/head";
import NavLink from "next/link";

import Page from "@/components/Page/Page";
import { Support } from "../theme/components/icons/Support";

const Reinscription = () => {
  const title = "Réinscription";
  return (
    <Page>
      <Head>
        <title>{title}</title>
      </Head>
      <Box w="100%" pt={[4, 8]} px={[1, 1, 6, 8]} color="grey.800" paddingY="4w">
        <Container maxW="xl">
          <Center>
            <Box width="769px" border="1px solid" borderColor="#E3E3FD" padding="4w" marginTop="2w" marginBottom="6w">
              <Stack alignItems="center" spacing="4w">
                <Support />
                <Heading fontSize="28px" fontWeight="bold">
                  Heureux de vous revoir !
                </Heading>
                <Text color="grey.800" align="center" fontSize="zeta" marginBottom="2w">
                  Le mode de connexion a changé pour renforcer la sécurité des données. <br />
                  Afin de retrouver votre accès aux fonctionnalités du tableau de bord de l&apos;apprentissage, nous
                  vous remercions de créer votre nouveau compte.
                </Text>

                <Button variant="secondary" href="/auth/inscription" marginTop="2w" as={NavLink}>
                  Créer mon nouveau compte
                </Button>
              </Stack>
            </Box>
          </Center>
        </Container>
      </Box>
    </Page>
  );
};

export default Reinscription;
