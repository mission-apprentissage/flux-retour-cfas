import { Flex, Box, Button, HStack, Text, Heading } from "@chakra-ui/react";
import { useFormik } from "formik";
import * as Yup from "yup";
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
import Ribbons from "../../components/Ribbons/Ribbons";

export const getServerSideProps = async (context) => ({ props: { ...(await getAuthServerSideProps(context)) } });

const Finalize = () => {
  const [auth, setAuth] = useAuth();
  const [, setToken] = useToken();
  const router = useRouter();

  const title = "Finalisation de votre inscription";

  const { handleSubmit: handleDemandeAcces } = useFormik({
    initialValues: {
      type: "organisme.admin",
    },
    validationSchema: Yup.object().shape({
      type: Yup.string().required("Requis"),
    }),
    onSubmit: (values) => {
      // eslint-disable-next-line no-undef, no-async-promise-executor
      return new Promise(async (resolve) => {
        try {
          const result = await _post("/api/v1/auth/demande-acces", values);
          if (result.loggedIn) {
            const user = decodeJwt(result.token);
            setAuth(user);
            setToken(result.token);
          }
        } catch (e) {
          console.error(e);
        }
        resolve("onSubmitHandler publish complete");
      });
    },
  });

  const { handleSubmit } = useFormik({
    initialValues: {},

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
          {auth.isInPendingValidation && auth.account_status === "FORCE_COMPLETE_PROFILE_STEP1" && (
            <Button size="md" variant="primary" onClick={handleDemandeAcces} px={6}>
              Demander l&rsquo;accès Gestion
            </Button>
          )}

          {auth.isInPendingValidation && auth.account_status === "FORCE_COMPLETE_PROFILE_STEP2" && (
            <Ribbons variant="loading" mt="0.5rem">
              <Box ml={3}>
                <Text color="grey.800" fontSize="1.2rem" fontWeight="bold">
                  Votre demande est en cours d&rsquo;étude par nos services.
                </Text>
                <Text color="bleufrance" mt={4} fontSize="0.9rem">
                  Vous serez notifié dès que votre demander aura été validée.
                </Text>
                <Text color="grey.800" mt={4}>
                  <Text textStyle="sm">
                    Vous êtes la premieres personne a demander une accès à cet organisme. <br />
                    Pour des raisons de sécurité, un de nos administrateurs va examiner votre demander. <br />
                  </Text>
                </Text>
              </Box>
            </Ribbons>
          )}
          {!auth.isInPendingValidation && (
            <HStack spacing="4w">
              <Button size="md" variant="primary" onClick={handleSubmit} px={6}>
                Accéder à mon espace
              </Button>
            </HStack>
          )}
          <Flex flexGrow={1} alignItems="end" mt={8}>
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
