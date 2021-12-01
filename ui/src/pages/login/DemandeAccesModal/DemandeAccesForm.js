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
  profil: Yup.string().required("Requis"),
  email: Yup.string().email("Format d'email invalide").required("Requis"),
  region: Yup.string().required("Requis"),
});

const initialValues = { email: "" };

const REGION_OPTIONS = [
  "Auvergne-Rhône-Alpes",
  "Bourgogne-Franche-Comté",
  "Bretagne",
  "Centre-Val de Loire",
  "Corse",
  "Grand Est",
  "Guadeloupe",
  "Guyane",
  "Hauts-de-France",
  "Île-de-France",
  "La Réunion",
  "Martinique",
  "Mayotte",
  "Normandie",
  "Nouvelle-Aquitaine",
  "Occitanie",
  "Pays de la Loire",
  "Provence-Alpes-Côte d'Azur",
];

const PROFIL_OPTIONS = [
  "DREETS / DDETS",
  "Conseil régional",
  "Académie",
  "Carif-Oref",
  "Opco",
  "Réseau",
  "Autre acteur régional",
];

const DemandeAccesForm = ({ onSubmit, onClose }) => {
  return (
    <Formik initialValues={initialValues} validationSchema={formValidationSchema} onSubmit={onSubmit}>
      {({ status = {}, isSubmitting }) => {
        return (
          <Form>
            <ModalBody paddingX="8w">
              <Stack spacing="2w" paddingY="5w" paddingX="4w" borderColor="bluefrance" border="1px solid">
                <Field name="region">
                  {({ field, meta }) => (
                    <FormControl isRequired isInvalid={meta.error && meta.touched}>
                      <FormLabel color="grey.800">Votre région</FormLabel>
                      <Select mt="1w" {...field} id={field.name} placeholder="Sélectionnez votre région">
                        {REGION_OPTIONS.map((region) => (
                          <option key={region}>{region}</option>
                        ))}
                      </Select>
                      <FormErrorMessage>{meta.error}</FormErrorMessage>
                    </FormControl>
                  )}
                </Field>
                <Field name="profil">
                  {({ field, meta }) => (
                    <FormControl isRequired isInvalid={meta.error && meta.touched}>
                      <FormLabel color="grey.800">Votre profil</FormLabel>
                      <Select mt="1w" {...field} id={field.name} placeholder="Sélectionnez votre profil">
                        {PROFIL_OPTIONS.map((profil) => (
                          <option key={profil}>{profil}</option>
                        ))}
                      </Select>
                      <FormErrorMessage>{meta.error}</FormErrorMessage>
                    </FormControl>
                  )}
                </Field>
                <Field name="email">
                  {({ field, meta }) => (
                    <FormControl isRequired isInvalid={meta.error && meta.touched}>
                      <FormLabel color="grey.800">Votre email</FormLabel>
                      <Input {...field} id={field.name} />
                      <FormErrorMessage>{meta.error}</FormErrorMessage>
                    </FormControl>
                  )}
                </Field>
              </Stack>
            </ModalBody>
            <ModalFooter paddingY="3w" marginTop="8w" boxShadow="0px -4px 16px 0px rgba(0, 0, 0, 0.08)">
              <Button variant="ghost" type="button" marginRight="2w" onClick={onClose}>
                Annuler
              </Button>
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

DemandeAccesForm.propTypes = {
  onClose: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
};

export default DemandeAccesForm;
