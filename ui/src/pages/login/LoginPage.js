import {
  Box,
  Button,
  Center,
  FormControl,
  FormErrorMessage,
  FormLabel,
  Heading,
  HStack,
  Input,
  Text,
} from "@chakra-ui/react";
import { Field, Form, Formik } from "formik";
import React from "react";
import { useHistory } from "react-router-dom";
import * as Yup from "yup";

import useAuth from "../../common/hooks/useAuth";
import { _post } from "../../common/httpClient";

const LoginPage = () => {
  const [, setAuth] = useAuth();
  const history = useHistory();

  const login = async (values, { setStatus }) => {
    try {
      const { access_token } = await _post("/api/login", values);
      setAuth(access_token);
      history.push("/");
    } catch (e) {
      console.error(e);
      setStatus({ error: e.prettyMessage });
    }
  };

  return (
    <Center height="100vh" verticalAlign="center">
      <Box width="28rem">
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
                    <Button color="primary" type="submit">
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
    </Center>
  );
};

export default LoginPage;
