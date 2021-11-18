import { Button, FormControl, FormErrorMessage, FormLabel, Input, Select, Stack, Text } from "@chakra-ui/react";
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
  "Autre acteur régional",
  "Opco",
  "Réseau",
  "Organisme de formation",
];

const DemandeAccesForm = ({ onSubmit }) => {
  return (
    <Formik initialValues={initialValues} validationSchema={formValidationSchema} onSubmit={onSubmit}>
      {({ status = {} }) => {
        return (
          <Form>
            <Stack marginBottom="4w" spacing="2w">
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
            <Button variant="primary" type="submit">
              Envoyer la demande
            </Button>
            {status.error && <Text color="error">{status.error}</Text>}
          </Form>
        );
      }}
    </Formik>
  );
};

DemandeAccesForm.propTypes = {
  onSubmit: PropTypes.func.isRequired,
};

export default DemandeAccesForm;
