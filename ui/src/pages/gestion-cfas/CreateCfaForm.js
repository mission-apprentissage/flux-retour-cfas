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

import { uaiRegex } from "../../common/domain/uai";

const formValidationSchema = Yup.object().shape({
  nom_reseau: Yup.string().required("Requis"),
  nom_etablissement: Yup.string().required("Requis"),
  uai: Yup.string().matches(uaiRegex, "UAI invalide").required("Requis"),
});

const initialValues = { nom_reseau: "", nom_etablissement: "", uai: "" };

const CreateReseauCfaForm = ({ onSubmit, networkList }) => {
  return (
    <Formik initialValues={initialValues} validationSchema={formValidationSchema} onSubmit={onSubmit}>
      {({ status = {}, isSubmitting }) => {
        return (
          <Form>
            <ModalBody paddingX="8w">
              <Stack spacing="2w" paddingY="5w" paddingX="4w" borderColor="bluefrance" border="1px solid">
                <Field name="nom_reseau">
                  {({ field, meta }) => (
                    <FormControl isRequired isInvalid={meta.error && meta.touched}>
                      <FormLabel color="grey.800">Nom du reseau</FormLabel>
                      <Select marginTop="1w" {...field} id={field.name} placeholder="Sélectionnez un réseau">
                        {networkList.map(({ nomReseau }) => (
                          <option key={nomReseau} value={nomReseau}>
                            {nomReseau}
                          </option>
                        ))}
                      </Select>
                      <FormErrorMessage>{meta.error}</FormErrorMessage>
                    </FormControl>
                  )}
                </Field>
                <Field name="nom_etablissement">
                  {({ field, meta }) => (
                    <FormControl isRequired isInvalid={meta.error && meta.touched}>
                      <FormLabel color="grey.800">Nom du CFA</FormLabel>
                      <Input {...field} id={field.name} />
                      <FormErrorMessage>{meta.error}</FormErrorMessage>
                    </FormControl>
                  )}
                </Field>
                <Field name="uai">
                  {({ field, meta }) => (
                    <FormControl isRequired isInvalid={meta.error && meta.touched}>
                      <FormLabel color="grey.800">UAI</FormLabel>
                      <Input {...field} id={field.name} />
                      <FormErrorMessage>{meta.error}</FormErrorMessage>
                    </FormControl>
                  )}
                </Field>
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

CreateReseauCfaForm.propTypes = {
  onSubmit: PropTypes.func.isRequired,
  networkList: PropTypes.array,
};

export default CreateReseauCfaForm;
