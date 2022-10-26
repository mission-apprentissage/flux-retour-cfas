import { Box, Button, FormControl, FormErrorMessage, Input, Stack, Text } from "@chakra-ui/react";
import { Field, Form, Formik } from "formik";
import PropTypes from "prop-types";
import * as Yup from "yup";

import { uaiRegex } from "../../../../../common/domain/uai.js";

const RechercherOrganismeParUaiForm = ({ onSubmit }) => {
  return (
    <Formik
      initialValues={{ uai: "" }}
      validationSchema={Yup.object().shape({
        uai: Yup.string().matches(uaiRegex, "UAI invalide").required("Requis"),
      })}
      onSubmit={onSubmit}
    >
      {() => {
        return (
          <Form>
            <Box marginBottom="2w">
              <Field name="uai">
                {({ field, meta }) => (
                  <FormControl isRequired isInvalid={meta.error && meta.touched} marginBottom="2w">
                    <Stack spacing="1w">
                      <Text fontSize="epsilon" color="gray.800">
                        Rechercher l’organisme par UAI :
                      </Text>
                      <Text fontSize="omega" color="gray.600">
                        Format valide d’une UAI : 7 chiffres et 1 lettre
                      </Text>
                      <Input {...field} id={field.name} placeholder="Ex : 1234567A" />
                      <FormErrorMessage>{meta.error}</FormErrorMessage>
                    </Stack>
                  </FormControl>
                )}
              </Field>
            </Box>
            <Button variant="primary" type="submit" width="60%">
              Vérifier
            </Button>
          </Form>
        );
      }}
    </Formik>
  );
};

RechercherOrganismeParUaiForm.propTypes = {
  onSubmit: PropTypes.func.isRequired,
};

export default RechercherOrganismeParUaiForm;
