import {
  Box,
  Button,
  Flex,
  FormControl,
  FormErrorMessage,
  FormLabel,
  Heading,
  Input,
  Text,
  VStack,
} from "@chakra-ui/react";
import { Field, Form, Formik } from "formik";
import Head from "next/head";
import NavLink from "next/link";
import { useRouter } from "next/router";
import React from "react";
import * as Yup from "yup";

import { _post } from "@/common/httpClient";
import { getAuthServerSideProps } from "@/common/SSR/getAuthServerSideProps";
import Page from "@/components/Page/Page";
import InformationBlock from "@/modules/auth/inscription/components/InformationBlock";

export const getServerSideProps = async (context) => ({ props: { ...(await getAuthServerSideProps(context)) } });

const ForgottenPasswordPage = () => {
  const router = useRouter();

  const resetPassword = async (values, { setStatus }) => {
    try {
      await _post("/api/v1/password/forgotten-password", { ...values });
      setStatus({ message: "Vous allez recevoir un lien vous permettant de réinitialiser votre mot de passe." });
      setTimeout(() => router.push("/"), 3000);
    } catch (e) {
      console.error(e);
      setStatus({ error: e.prettyMessage });
    }
  };

  const title = "Mot de passe oublié";

  return (
    <Page>
      <Head>
        <title>{title}</title>
      </Head>
      <Flex w="100%" mt={8} minH="40vh" direction={{ base: "column", md: "row" }}>
        <Flex
          flexDirection="column"
          p={12}
          w={{ base: "100%", md: "50%" }}
          h="100%"
          border="1px solid"
          borderColor="openbluefrance"
        >
          <Box width={["auto", "28rem"]}>
            <Heading as="h2" fontSize="2xl" mb={[3, 6]}>
              {title}
            </Heading>
            <Formik
              initialValues={{
                email: "",
              }}
              validationSchema={Yup.object().shape({
                email: Yup.string().email("Veuillez saisir un email valide").required("Veuillez saisir un identifiant"),
              })}
              onSubmit={resetPassword}
            >
              {({ status = {} }) => {
                return (
                  <Form>
                    <Field name="email">
                      {({ field, meta }) => {
                        return (
                          <FormControl isRequired isInvalid={meta.error && meta.touched} marginBottom="2w">
                            <FormLabel>Votre email :</FormLabel>
                            <Input {...field} id={field.name} placeholder="prenom.nom@courriel.fr" />
                            <FormErrorMessage>{meta.error}</FormErrorMessage>
                          </FormControl>
                        );
                      }}
                    </Field>
                    {status.error && (
                      <Text color="error" my={2}>
                        {status.error}
                      </Text>
                    )}
                    {status.message && (
                      <Text color="info" my={2}>
                        {status.message}
                      </Text>
                    )}
                    <VStack>
                      <Button variant="primary" type={"submit"} w="100%">
                        Recevoir un courriel de ré-initialisation
                      </Button>
                      <NavLink type={"submit"} href="/auth/connexion">
                        Annuler
                      </NavLink>
                    </VStack>
                  </Form>
                );
              }}
            </Formik>
          </Box>
        </Flex>
        <InformationBlock w={{ base: "100%", md: "50%" }} />
      </Flex>
    </Page>
  );
};

export default ForgottenPasswordPage;
