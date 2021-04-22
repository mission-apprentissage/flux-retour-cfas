import {
  Box,
  Button,
  Center,
  Flex,
  FormControl,
  FormErrorMessage,
  FormLabel,
  Heading,
  HStack,
  Input,
  Stack,
  Text,
} from "@chakra-ui/react";
import { Field, Form, Formik } from "formik";
import PropTypes from "prop-types";
import queryString from "query-string";
import React from "react";
import * as Yup from "yup";

import useAuth from "../../common/hooks/useAuth";
import { _post } from "../../common/httpClient";

const LoginPage = ({ history }) => {
  const [, setAuth] = useAuth();
  const pathToRedirectTo = queryString.parse(history.location.search)?.redirect || "/";

  const login = async (values, { setStatus }) => {
    try {
      const { access_token } = await _post("/api/login", values);
      setAuth(access_token);
      history.push(pathToRedirectTo);
    } catch (e) {
      console.error(e);
      setStatus({ error: e.prettyMessage });
    }
  };

  return (
    <Center background="bluefrance" height="100vh" verticalAlign="center">
      <Stack align="center">
        <Flex align="center" mb="5">
          <Text fontSize="beta" fontWeight="700" color="white" mr="5">
            <i className="ri-shield-star-fill"></i>
          </Text>
          <Text fontSize="beta" fontWeight="700" color="white">
            Tableau de bord - Flux Cfas
          </Text>
        </Flex>
        <Box background="white" borderRadius="2%" width="28rem">
          <Center>
            <Heading mt={4} fontFamily="Marianne" fontWeight="700" marginBottom="2w">
              Connexion
            </Heading>
          </Center>
          <Box p={8} maxWidth="500px" borderWidth={1} borderRadius={8} boxShadow="lg">
            <Formik
              initialValues={{ username: "", password: "" }}
              validationSchema={Yup.object().shape({
                username: Yup.string().required("Requis"),
                password: Yup.string().required("Requis"),
              })}
              onSubmit={login}
            >
              {({ status = {} }) => {
                return (
                  <Form>
                    <Box marginBottom="2w">
                      <Field name="username">
                        {({ field, meta }) => (
                          <FormControl isRequired isInvalid={meta.error && meta.touched} marginBottom="2w">
                            <FormLabel>Identifiant</FormLabel>
                            <Input {...field} id={field.name} placeholder="Votre identifiant..." />
                            <FormErrorMessage>{meta.error}</FormErrorMessage>
                          </FormControl>
                        )}
                      </Field>
                      <Field name="password">
                        {({ field, meta }) => {
                          return (
                            <FormControl isRequired isInvalid={meta.error && meta.touched} marginBottom="2w">
                              <FormLabel>Mot de passe</FormLabel>
                              <Input {...field} id={field.name} type="password" placeholder="Votre mot de passe..." />
                              <FormErrorMessage>{meta.error}</FormErrorMessage>
                            </FormControl>
                          );
                        }}
                      </Field>
                    </Box>
                    <HStack spacing="4w">
                      <Button color="white" type="submit">
                        Connexion
                      </Button>
                    </HStack>
                    {status.error && <Text color="error">{status.error}</Text>}
                  </Form>
                );
              }}
            </Formik>
          </Box>
        </Box>
      </Stack>
    </Center>
  );
};

LoginPage.propTypes = {
  history: PropTypes.shape({
    location: PropTypes.shape({
      search: PropTypes.string,
    }).isRequired,
    push: PropTypes.func.isRequired,
  }).isRequired,
};

export default LoginPage;
