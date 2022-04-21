import { Box, Button, FormControl, FormErrorMessage, FormLabel, Link, Select, Stack, Text } from "@chakra-ui/react";
import { Field } from "formik";
import PropTypes from "prop-types";
import { NavLink } from "react-router-dom";

import AskUniqueURLBackToAskUaiSection from "./AskUniqueURLBackToAskUaiSection";

const AskUniqueURLUaiNotFound = ({ uai_organisme, isSubmitting, setPreviousFormStep }) => {
  return (
    <Stack>
      <Stack paddingX="4w" paddingTop="2w" borderWidth="1px" borderColor="bluefrance" spacing="2w" paddingBottom="4w">
        <Text color="grey.800" fontSize="gamma" marginBottom="1w">
          <strong>
            Le Tableau de bord de l’apprentissage ne collecte pas ou plus de données relatives à l’UAI {uai_organisme}.
          </strong>
          Afin de pouvoir vous guider merci de répondre à la question suivante :
        </Text>
        <Field name="transmettre_donnees">
          {({ field, meta }) => (
            <>
              <FormControl isRequired isInvalid={meta.error && meta.touched}>
                <FormLabel color="grey.800" marginTop="1w">
                  Transmettez-vous déjà vos données au Tableau de bord de l’apprentissage ? :
                </FormLabel>
                <Select placeholder="Sélectionner une option" {...field} id={field.transmettre_donnees}>
                  <option>Oui</option>
                  <option>Non</option>
                  <option>Je ne sais pas</option>
                </Select>
                <FormErrorMessage>{meta.error}</FormErrorMessage>
              </FormControl>

              {/* Case Oui */}
              {field.value === "Oui" && (
                <Button
                  width="55%"
                  variant="primary"
                  marginTop="3w"
                  as={Link}
                  href="mailto:support-tdb@apprentissage.beta.gouv.fr"
                  isLoading={isSubmitting}
                >
                  Contacter l’équipe support
                  <Box as="i" marginLeft="1v" className="ri-arrow-right-line" />
                </Button>
              )}

              {/* Case Non */}
              {field.value === "Non" && (
                <Button
                  width="55%"
                  variant="primary"
                  marginTop="3w"
                  as={NavLink}
                  to="/organisme-formation/transmettre"
                  isLoading={isSubmitting}
                >
                  Consulter la page dédiée
                  <Box as="i" marginLeft="1v" className="ri-arrow-right-line" />
                </Button>
              )}

              {/* Case Je ne sais pas */}
              {field.value === "Je ne sais pas" && (
                <Button
                  width="55%"
                  variant="primary"
                  marginTop="3w"
                  as={NavLink}
                  to="/organisme-formation/aide"
                  isLoading={isSubmitting}
                >
                  Consulter la page support
                  <Box as="i" marginLeft="1v" className="ri-arrow-right-line" />
                </Button>
              )}
            </>
          )}
        </Field>
      </Stack>
      <AskUniqueURLBackToAskUaiSection setPreviousFormStep={setPreviousFormStep} />
    </Stack>
  );
};

AskUniqueURLUaiNotFound.propTypes = {
  uai_organisme: PropTypes.string.isRequired,
  isSubmitting: PropTypes.bool.isRequired,
  setPreviousFormStep: PropTypes.func.isRequired,
};
export default AskUniqueURLUaiNotFound;
