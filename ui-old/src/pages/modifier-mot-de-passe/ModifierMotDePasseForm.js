import { Button, FormControl, FormErrorMessage, FormLabel, Input, Text } from "@chakra-ui/react";
import { Field, Form, Formik } from "formik";
import PropTypes from "prop-types";
import React from "react";
import * as Yup from "yup";

import { InputLegend } from "../../common/components";

const formValidationSchema = Yup.object().shape({
  newPassword: Yup.string().min(16, "Votre mot de passe doit contenir au moins 16 caractères").required("Requis"),
});

const ModifierMotPasseForm = ({ onSubmit }) => {
  return (
    <Formik initialValues={{ newPassword: "" }} validationSchema={formValidationSchema} onSubmit={onSubmit}>
      {({ status = {} }) => {
        return (
          <Form>
            <Field name="newPassword">
              {({ field, meta }) => {
                return (
                  <FormControl isRequired isInvalid={meta.error && meta.touched}>
                    <FormLabel color="grey.800" marginBottom="1v">
                      nouveau mot de passe
                    </FormLabel>
                    <InputLegend>Veuillez entrer minimum 16 caractères</InputLegend>
                    <Input {...field} id={field.name} type="password" placeholder="Votre nouveau mot de passe..." />
                    <FormErrorMessage>{meta.error}</FormErrorMessage>
                  </FormControl>
                );
              }}
            </Field>
            <Button variant="primary" type="submit" width="full" marginTop="3w">
              Enregistrer
            </Button>
            {status.error && <Text color="error">{status.error}</Text>}
          </Form>
        );
      }}
    </Formik>
  );
};

ModifierMotPasseForm.propTypes = {
  onSubmit: PropTypes.func.isRequired,
};

export default ModifierMotPasseForm;
