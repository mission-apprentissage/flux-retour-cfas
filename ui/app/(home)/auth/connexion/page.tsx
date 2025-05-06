"use client";

import {
  Flex,
  Box,
  Button,
  FormControl,
  FormErrorMessage,
  FormLabel,
  HStack,
  InputGroup,
  Input,
  InputRightElement,
  Link,
  Text,
  Heading,
} from "@chakra-ui/react";
import { Field, Form, Formik } from "formik";
import NavLink from "next/link";
import React from "react";
import { useLocalStorage } from "usehooks-ts";
import * as Yup from "yup";

import { _post } from "@/common/httpClient";
import useAuth from "@/hooks/useAuth";
import { AlertRounded, ShowPassword } from "@/theme/components/icons";

const Login = (props) => {
  const [originConnexionUrl, setOriginConnexionUrl] = useLocalStorage("originConnexionUrl", "");
  const { refreshSession } = useAuth();

  const [show, setShow] = React.useState(false);
  const onShowPassword = () => setShow(!show);

  const login = async (values, { setStatus }) => {
    try {
      await _post("/api/v1/auth/login", values);
      await refreshSession();
      if (originConnexionUrl) {
        setOriginConnexionUrl("");
        window.location.href = originConnexionUrl;
      } else {
        window.location.href = "/";
      }
    } catch (err) {
      const errorMessage = err?.json?.data?.message || err.message;
      setStatus({ error: errorMessage });
    }
  };

  return (
    <Flex flexDirection="column" p={12} {...props}>
      <Heading as="h2" fontSize="2xl" mb={[3, 6]}>
        Connectez-vous
      </Heading>
      <Formik
        initialValues={{ email: "", password: "" }}
        validationSchema={Yup.object().shape({
          email: Yup.string().email("Format d'email invalide").required("Requis"),
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
                    <FormControl isRequired isInvalid={meta.error && meta.touched} mb={5}>
                      <FormLabel>Email (votre identifiant)</FormLabel>
                      <Input {...field} id={field.name} placeholder="prenom.nom@courriel.fr" />
                      <FormErrorMessage>{meta.error}</FormErrorMessage>
                    </FormControl>
                  )}
                </Field>
                <Field name="password">
                  {({ field, meta }) => {
                    return (
                      <FormControl isRequired isInvalid={meta.error && meta.touched} mb={5}>
                        <FormLabel>Mot de passe</FormLabel>
                        <InputGroup size="md">
                          <Input
                            {...field}
                            id={field.name}
                            type={show ? "text" : "password"}
                            placeholder="************************"
                          />
                          <InputRightElement width="2.5rem">
                            <ShowPassword boxSize={5} onClick={onShowPassword} cursor="pointer" />
                          </InputRightElement>
                        </InputGroup>
                        <FormErrorMessage>{meta.error}</FormErrorMessage>
                      </FormControl>
                    );
                  }}
                </Field>
              </Box>
              <HStack spacing="4w" mt={8}>
                <Button variant="primary" type="submit">
                  Connexion
                </Button>
                <Link href="/auth/mot-de-passe-oublie" as={NavLink} color="grey.600">
                  Mot de passe oublié
                </Link>
              </HStack>
              {status.error && (
                <Text color="error" mt={8}>
                  <AlertRounded mb="0.5" /> {status.error}
                </Text>
              )}
            </Form>
          );
        }}
      </Formik>
      <HStack fontSize={14} mt="4w">
        <Text>Vous n’avez pas encore de compte ? </Text>
        <Link color="bluefrance" as={NavLink} href="/auth/inscription">
          Créer un compte
        </Link>
      </HStack>
    </Flex>
  );
};

export default Login;
