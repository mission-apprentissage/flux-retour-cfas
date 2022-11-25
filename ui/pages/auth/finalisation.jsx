import { Flex, Box, Button, HStack, Text, Heading } from "@chakra-ui/react";
import { useFormik } from "formik";
import React from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import { Page } from "../../components/Page/Page";

import { decodeJwt } from "jose";

import useToken from "../../hooks/useToken";
import useAuth from "../../hooks/useAuth";
import { _post } from "../../common/httpClient";
import { getAuthServerSideProps } from "../../common/SSR/getAuthServerSideProps";
import Link from "../../components/Links/Link";

export const getServerSideProps = async (context) => ({ props: { ...(await getAuthServerSideProps(context)) } });

const Finalize = () => {
  const [auth, setAuth] = useAuth();
  const [, setToken] = useToken();
  const router = useRouter();

  const title = "Finalisation de votre inscription";

  const { handleSubmit } = useFormik({
    initialValues: {
      compte: "",
      siret: auth.siret || "",
    },

    onSubmit: (values) => {
      // eslint-disable-next-line no-undef, no-async-promise-executor
      return new Promise(async (resolve) => {
        try {
          const result = await _post("/api/v1/auth/finalize", values);
          if (result.loggedIn) {
            const user = decodeJwt(result.token);
            setAuth(user);
            setToken(result.token);
            router.push("/mon-espace/mon-organisme");
          }
        } catch (e) {
          console.error(e);
        }
        resolve("onSubmitHandler publish complete");
      });
    },
  });

  return (
    <Page>
      <Head>
        <title>{title}</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Flex w="full" flexDirection="column" h="full" mt={4}>
        <Heading textStyle="h2" color="grey.800" mt={5}>
          {title}
        </Heading>
        <Box mt={5}>
          <HStack spacing="4w">
            <Button size="md" variant="primary" onClick={handleSubmit} px={6}>
              Finaliser votre inscription
            </Button>
          </HStack>
          <Flex flexGrow={1} alignItems="end">
            <Text mt={8} fontSize="1rem">
              Vous rencontrez des difficultés à passer cette étape ?{" "}
              <Link href="/questions-reponses" color="bluefrance" ml={3}>
                Contacter l&apos;assistance
              </Link>
            </Text>
          </Flex>
        </Box>
      </Flex>
    </Page>
  );
};

export default Finalize;
