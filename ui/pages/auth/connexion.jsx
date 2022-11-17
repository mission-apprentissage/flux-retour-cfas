import {
  Box,
  Button,
  Flex,
  FormControl,
  FormErrorMessage,
  FormLabel,
  Heading,
  HStack,
  Input,
  InputGroup,
  InputRightElement,
  Link,
  Text,
} from "@chakra-ui/react";
import { Field, Form, Formik } from "formik";
import { decodeJwt } from "jose";
import Head from "next/head";
import NavLink from "next/link";
import { useRouter } from "next/router";
import React from "react";
import * as Yup from "yup";

import { _post } from "../../common/httpClient";
import { getAuthServerSideProps } from "../../common/SSR/getAuthServerSideProps";
import { Page } from "../../components/Page/Page";
import useAuth from "../../hooks/useAuth";
import useToken from "../../hooks/useToken";
import { ShowPassword } from "../../theme/components/icons";

const Login = (props) => {
  const [, setAuth] = useAuth();
  const [, setToken] = useToken();
  const router = useRouter();

  const [show, setShow] = React.useState(false);
  const handleClick = () => setShow(!show);

  const login = async (values, { setStatus }) => {
    try {
      const result = await _post("/api/v1/auth/login", values);
      if (result.loggedIn) {
        const user = decodeJwt(result.token);
        setAuth(user);
        setToken(result.token);
        if (!user.account_status === "NOT_CONFIRMED") {
          router.push(`/auth/en-attente-confirmation`);
        } else {
          router.push("/");
        }
      }
    } catch (e) {
      if (e.messages?.details?.message === "Mauvaise méthode de connexion") {
        setStatus({ error: "Veuillez vous connecter avec une autre méthode." });
      } else {
        console.error(e);
        setStatus({ error: e.prettyMessage });
      }
    }
  };

  return (
    <Flex {...props}>
      <Heading as="h2" fontSize="2xl" marginBottom={[3, 6]}>
        J&apos;ai déjà un compte
      </Heading>
      <Formik
        initialValues={{ email: "", password: "" }}
        validationSchema={Yup.object().shape({
          email: Yup.string().email().required("Requis"),
          password: Yup.string().required("Requis"),
        })}
        onSubmit={login}
      >
        {({ status = {} }) => {
          return (
            <Form>
              <Box>
                <Field name="email">
                  {({ field, meta }) => (
                    <FormControl isRequired isInvalid={meta.error && meta.touched} marginBottom={5}>
                      <FormLabel>Identifiant</FormLabel>
                      <Input {...field} id={field.name} placeholder="Exemple : prenom.nom@mail.com" />
                      <FormErrorMessage>{meta.error}</FormErrorMessage>
                    </FormControl>
                  )}
                </Field>
                <Field name="password">
                  {({ field, meta }) => {
                    return (
                      <FormControl isRequired isInvalid={meta.error && meta.touched} marginBottom={5}>
                        <FormLabel>Mot de passe</FormLabel>
                        <InputGroup size="md">
                          <Input
                            {...field}
                            id={field.name}
                            type={show ? "text" : "password"}
                            placeholder="Votre mot de passe..."
                          />
                          <InputRightElement width="2.5rem">
                            <ShowPassword boxSize={5} onClick={handleClick} cursor="pointer" />
                          </InputRightElement>
                        </InputGroup>
                        <FormErrorMessage>{meta.error}</FormErrorMessage>
                      </FormControl>
                    );
                  }}
                </Field>
              </Box>
              <HStack spacing="4w" marginTop={8}>
                <Button variant="primary" type="submit">
                  Se connecter
                </Button>
                <Link href="/auth/mot-de-passe-oublie" as={NavLink} color="grey.600">
                  Mot de passe oublié
                </Link>
              </HStack>
              {status.error && (
                <Text color="error" marginTop={2}>
                  {status.error}
                </Text>
              )}
            </Form>
          );
        }}
      </Formik>
      <Box marginTop={12}>
        <Text fontSize="1rem">
          <Link href="/auth/inscription" as={NavLink} color="bluefrance" marginLeft={3}>
            &gt; Je n&apos;ai pas encore de compte
          </Link>
        </Text>
      </Box>
    </Flex>
  );
};

export const getServerSideProps = async (context) => ({ props: { ...(await getAuthServerSideProps(context)) } });

export default function ConnexionPage() {
  const styleProps = {
    flexBasis: "50%",
    p: 12,
    justifyContent: "center",
  };

  return (
    <Page>
      <Head>
        <title>Connexion</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Flex width="full" maxWidth="xl" marginTop={4}>
        <Login {...styleProps} flexDirection="column" border="1px solid" borderColor="openbluefrance" />
      </Flex>
    </Page>
  );
}
