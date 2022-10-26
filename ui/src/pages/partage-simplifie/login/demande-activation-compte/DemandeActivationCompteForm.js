import { Box, Button, FormControl, FormErrorMessage, FormLabel, Input, Text } from "@chakra-ui/react";
import { Field, Form, Formik } from "formik";
import PropTypes from "prop-types";
import React from "react";
import * as Yup from "yup";

const formValidationSchema = Yup.object().shape({
  email: Yup.string().email("Format d'email invalide").required("Requis"),
});

const DemandeActivationCompteForm = ({ onSubmit }) => {
  return (
    <Formik initialValues={{ email: "" }} validationSchema={formValidationSchema} onSubmit={onSubmit}>
      {({ status = {} }) => {
        return (
          <Form>
            <Box marginBottom="2w">
              <Field name="email">
                {({ field, meta }) => (
                  <FormControl isRequired isInvalid={meta.error && meta.touched} marginBottom="2w">
                    <FormLabel color="grey.800">Votre email :</FormLabel>
                    <Input {...field} id={field.name} placeholder="Votre adresse e-mail..." />
                    <FormErrorMessage>{meta.error}</FormErrorMessage>
                  </FormControl>
                )}
              </Field>
            </Box>
            <Button variant="primary" type="submit" width="full">
              Demander à activer mon compte
            </Button>
            {status.error && <Text color="error">{status.error}</Text>}
          </Form>
        );
      }}
    </Formik>
  );
};

DemandeActivationCompteForm.propTypes = {
  onSubmit: PropTypes.func.isRequired,
};

export default DemandeActivationCompteForm;
