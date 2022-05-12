import {
  Button,
  FormControl,
  FormErrorMessage,
  FormLabel,
  Input,
  ModalBody,
  ModalFooter,
  Select,
  Stack,
  Text,
} from "@chakra-ui/react";
import { Field, Form, Formik } from "formik";
import PropTypes from "prop-types";
import React from "react";
import * as Yup from "yup";

const formValidationSchema = Yup.object().shape({
  username: Yup.string().required("Requis"),
  email: Yup.string().email("Format d'email invalide").required("Requis"),
  role: Yup.string().required("Requis"),
});

const initialValues = { username: "", email: "", role: "" };

const USER_ROLE = [
  { label: "Pilote", value: "pilot" },
  { label: "Réseau", value: "network" },
];

const CreateUserForm = ({ onSubmit }) => {
  return (
    <Formik initialValues={initialValues} validationSchema={formValidationSchema} onSubmit={onSubmit}>
      {({ status = {}, isSubmitting, values }) => {
        return (
          <Form>
            <ModalBody paddingX="8w">
              <Stack spacing="2w" paddingY="5w" paddingX="4w" borderColor="bluefrance" border="1px solid">
                <Field name="username">
                  {({ field, meta }) => (
                    <FormControl isRequired isInvalid={meta.error && meta.touched}>
                      <FormLabel color="grey.800">nom d&apos;utilisateur</FormLabel>
                      <Input {...field} id={field.name} />
                      <FormErrorMessage>{meta.error}</FormErrorMessage>
                    </FormControl>
                  )}
                </Field>
                <Field name="email">
                  {({ field, meta }) => (
                    <FormControl isRequired isInvalid={meta.error && meta.touched}>
                      <FormLabel color="grey.800">email</FormLabel>
                      <Input {...field} id={field.name} />
                      <FormErrorMessage>{meta.error}</FormErrorMessage>
                    </FormControl>
                  )}
                </Field>
                <Field name="role">
                  {({ field, meta }) => (
                    <FormControl isRequired isInvalid={meta.error && meta.touched}>
                      <FormLabel color="grey.800">rôle de l&apos;utilisateur</FormLabel>
                      <Select marginTop="1w" {...field} id={field.name} placeholder="Sélectionnez un role">
                        {USER_ROLE.map(({ value, label }) => (
                          <option key={value} value={value}>
                            {label}
                          </option>
                        ))}
                      </Select>
                      <FormErrorMessage>{meta.error}</FormErrorMessage>
                    </FormControl>
                  )}
                </Field>
                {values.role === USER_ROLE[1].value && (
                  <Field name="network">
                    {({ field, meta }) => (
                      <FormControl isRequired isInvalid={meta.error && meta.touched}>
                        <FormLabel color="grey.800">réseau</FormLabel>
                        <Input {...field} id={field.name} />
                        <FormErrorMessage>{meta.error}</FormErrorMessage>
                      </FormControl>
                    )}
                  </Field>
                )}
              </Stack>
            </ModalBody>
            <ModalFooter paddingY="3w" marginTop="5w" boxShadow="0px -4px 16px 0px rgba(0, 0, 0, 0.08)">
              <Button type="submit" variant="primary" isLoading={isSubmitting}>
                Envoyer
              </Button>
            </ModalFooter>
            {status.error && <Text color="error">{status.error}</Text>}
          </Form>
        );
      }}
    </Formik>
  );
};

CreateUserForm.propTypes = {
  onSubmit: PropTypes.func.isRequired,
};

export default CreateUserForm;
