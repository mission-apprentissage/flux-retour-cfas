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
import React from "react";
import * as Yup from "yup";
import { useRouter } from "next/router";
import NavLink from "next/link";

import { _post } from "@/common/httpClient";
import { getAuthServerSideProps } from "@/common/SSR/getAuthServerSideProps";

export const getServerSideProps = async (context) => ({ props: { ...(await getAuthServerSideProps(context)) } });

const ForgottenPasswordPage = () => {
  const router = useRouter();

  const resetPassword = async (values, { setStatus }) => {
    try {
      await _post("/api/v1/password/forgotten-password", { ...values });
      setStatus({ message: "Vous allez recevoir un lien vous permettant de réinitialiser votre mot de passe." });
      setTimeout(() => router.push("/"), 1500);
    } catch (e) {
      console.error(e);
      setStatus({ error: e.prettyMessage });
    }
  };

  const title = "Mot de passe oublié";

  return (
    <Flex height="100vh" justifyContent="center" mt="10">
      <Box width={["auto", "28rem"]}>
        <Heading fontFamily="Marianne" fontWeight="700" marginBottom="2w">
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
                  <Text color="error" mt={2}>
                    {status.error}
                  </Text>
                )}
                {status.message && (
                  <Text color="info" mt={2}>
                    {status.message}
                  </Text>
                )}
                <VStack>
                  <Button variant="primary" type={"submit"} w="100%">
                    Recevoir un courriel de ré-initialisation
                  </Button>
                  <NavLink type={"submit"} w="100%" href="/auth/connexion">
                    Annuler
                  </NavLink>
                </VStack>
              </Form>
            );
          }}
        </Formik>
      </Box>
    </Flex>
  );
};

export default ForgottenPasswordPage;
