import { Button, FormControl, FormErrorMessage, FormLabel, Input, Stack, Text } from "@chakra-ui/react";
import { Field } from "formik";
import PropTypes from "prop-types";

import AskUniqueURLBackToAskUaiSection from "./AskUniqueURLBackToAskUaiSection";

const AskUniqueURLUaiFound = ({ uai_organisme, isSubmitting, setPreviousFormStep }) => {
  return (
    <Stack>
      <Stack paddingX="4w" paddingTop="2w" borderWidth="1px" borderColor="bluefrance" spacing="2w" paddingBottom="4w">
        <Text color="grey.800" fontSize="gamma" marginBottom="1w">
          <strong>
            Le Tableau de bord de l’apprentissage collecte bien des données relatives à l’UAI {uai_organisme}
          </strong>
          , pour finaliser votre demande merci de renseigner les informations suivantes :
        </Text>
        <Field name="nom_organisme">
          {({ field, meta }) => (
            <FormControl isRequired isInvalid={meta.error && meta.touched}>
              <FormLabel color="grey.800" marginBottom="1w">
                Nom de votre organisme
              </FormLabel>
              <Input {...field} id={field.name} placeholder="Précisez ici..." />
              <FormErrorMessage>{meta.error}</FormErrorMessage>
            </FormControl>
          )}
        </Field>
        <Field name="code_postal_organisme">
          {({ field, meta }) => (
            <FormControl isRequired isInvalid={meta.error && meta.touched}>
              <FormLabel marginTop="1w" color="grey.800">
                Code postal
              </FormLabel>
              <Input {...field} id={field.name} placeholder="Ex : 75016" />
              <FormErrorMessage>{meta.error}</FormErrorMessage>
            </FormControl>
          )}
        </Field>
        <Field name="email_demandeur">
          {({ field, meta }) => (
            <FormControl isRequired isInvalid={meta.error && meta.touched}>
              <FormLabel color="grey.800" marginTop="1w">
                Email de la personne faisant la demande
              </FormLabel>
              <Input {...field} id={field.name} placeholder="exemple@mail.fr" />
              <FormErrorMessage>{meta.error}</FormErrorMessage>
            </FormControl>
          )}
        </Field>
        <Button width="40%" type="submit" marginTop="3w" variant="primary" isLoading={isSubmitting}>
          Envoyer la demande
        </Button>
      </Stack>
      <AskUniqueURLBackToAskUaiSection setPreviousFormStep={setPreviousFormStep} />
    </Stack>
  );
};

AskUniqueURLUaiFound.propTypes = {
  uai_organisme: PropTypes.string.isRequired,
  isSubmitting: PropTypes.bool.isRequired,
  setPreviousFormStep: PropTypes.func.isRequired,
};
export default AskUniqueURLUaiFound;
