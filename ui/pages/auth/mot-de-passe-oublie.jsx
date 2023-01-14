import { Box, Button, Flex, FormControl, FormErrorMessage, FormLabel, Heading, Input, Text } from "@chakra-ui/react";
import { Field, Form, Formik } from "formik";
import React from "react";
import * as Yup from "yup";
import { useRouter } from "next/router";
import { _post } from "../../common/httpClient";
import { getAuthServerSideProps } from "../../common/SSR/getAuthServerSideProps";

export const getServerSideProps = async (context) => ({ props: { ...(await getAuthServerSideProps(context)) } });

const ForgottenPasswordPage = () => {
  const router = useRouter();

  const resetPassword = async (values, { setStatus }) => {
    try {
      await _post("/api/v1/password/forgotten-password", { ...values });
      setStatus({ message: "Un email vous a été envoyé." });
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
            username: "",
          }}
          validationSchema={Yup.object().shape({
            username: Yup.string().required("Veuillez saisir un identifiant"),
          })}
          onSubmit={resetPassword}
        >
          {({ status = {} }) => {
            return (
              <Form>
                <Field name="username">
                  {({ field, meta }) => {
                    return (
                      <FormControl isRequired isInvalid={meta.error && meta.touched} marginBottom="2w">
                        <FormLabel>Identifiant</FormLabel>
                        <Input {...field} id={field.name} placeholder="Votre email ou identifiant..." />
                        <FormErrorMessage>{meta.error}</FormErrorMessage>
                      </FormControl>
                    );
                  }}
                </Field>
                <Button variant="primary" type={"submit"}>
                  Demander un nouveau mot de passe
                </Button>
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
              </Form>
            );
          }}
        </Formik>
      </Box>
    </Flex>
  );
};

export default ForgottenPasswordPage;
