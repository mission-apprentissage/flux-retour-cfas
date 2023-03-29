import React from "react";
import Head from "next/head";
import { Box, Flex, FormControl, FormLabel, Heading, Radio, RadioGroup, VStack } from "@chakra-ui/react";

import Page from "@/components/Page/Page";
import InformationBlock from "@/modules/auth/inscription/components/InformationBlock";
import { getAuthServerSideProps } from "@/common/SSR/getAuthServerSideProps";
import { useRouter } from "next/router";

export const getServerSideProps = async (context) => ({ props: { ...(await getAuthServerSideProps(context)) } });

const categoriesCompte = [
  {
    text: "Un CFA ou organisme de formation",
    value: "organisme_formation",
  },
  {
    text: "Un opérateur public (DREETS, DEETS, DRAAF, Académie, Conseil régional...)",
    value: "operateur_public",
  },
  {
    text: "Un réseau d'organismes de formation",
    value: "tete_de_reseau",
  },
  {
    text: "Autre",
    value: "autre",
  },
];

const RegisterPage = () => {
  const router = useRouter();
  return (
    <Page>
      <Head>
        <title>Inscription</title>
      </Head>
      <Flex w="100%" mt={8} minH="40vh" direction={{ base: "column", md: "row" }}>
        <Box flexDirection="column" border="1px solid" h="100%" flexGrow={1} borderColor="openbluefrance" p={12}>
          <Heading as="h2" fontSize="2xl" mb={[3, 6]}>
            Créer votre compte
          </Heading>
          <Box>
            <FormControl>
              <FormLabel>Je représente :</FormLabel>
              <RadioGroup id="type" name="type" mt={8}>
                <VStack alignItems="baseline" fontSize="1.2rem" spacing={8}>
                  {categoriesCompte.map((item, i) => {
                    return (
                      <Radio
                        key={i}
                        value={item.value}
                        onChange={(e) => {
                          router.push(`/auth/inscription/${e.target.value}`);
                        }}
                        size="lg"
                      >
                        {item.text}
                      </Radio>
                    );
                  })}
                </VStack>
              </RadioGroup>
            </FormControl>
          </Box>
        </Box>

        <InformationBlock w={{ base: "100%", md: "50%" }} />
      </Flex>
    </Page>
  );
};

export default RegisterPage;
