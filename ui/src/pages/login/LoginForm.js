import { Box, Button, Flex, FormControl, FormErrorMessage, FormLabel, Input, Text } from "@chakra-ui/react";
import { Field, Form, Formik } from "formik";
import PropTypes from "prop-types";
import React from "react";
import * as Yup from "yup";

const LoginForm = ({ onSubmit }) => {
  return (
    <Box p={8} maxWidth="500px" borderTopWidth={1} boxShadow="lg">
      <Formik
        initialValues={{ username: "", password: "" }}
        validationSchema={Yup.object().shape({
          username: Yup.string().required("Requis"),
          password: Yup.string().required("Requis"),
        })}
        onSubmit={onSubmit}
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
              <Flex justifyContent="flex-end">
                <Button variant="primary" type="submit">
                  Connexion
                </Button>
              </Flex>
              {status.error && <Text color="error">{status.error}</Text>}
            </Form>
          );
        }}
      </Formik>
    </Box>
  );
};

LoginForm.propTypes = {
  onSubmit: PropTypes.func.isRequired,
};

export default LoginForm;
