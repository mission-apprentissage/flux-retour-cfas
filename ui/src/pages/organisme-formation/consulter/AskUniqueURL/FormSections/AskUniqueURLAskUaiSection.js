import { Box, Button, FormControl, FormErrorMessage, FormLabel, Input, Stack, Text } from "@chakra-ui/react";
import { Field } from "formik";
import PropTypes from "prop-types";

import { fetchCfa } from "../../../../../common/api/tableauDeBord";

const AskUniqueURLAskUaiSection = ({ setUaiFound, setUaiNotFound }) => {
  /**
   * Checks uai existance in API and set form state
   * @param {*} fieldError
   * @param {*} uai
   */
  const checkUai = async (fieldError, uai) => {
    // If no error & uai not nullOrEmpty
    if (!fieldError && uai !== null && uai !== "") {
      try {
        const data = await fetchCfa(uai);
        if (data?.uai !== undefined) {
          setUaiFound();
        } else {
          setUaiNotFound();
        }
      } catch (err) {
        setUaiNotFound();
      }
    }
  };

  return (
    <Stack paddingX="4w" paddingTop="2w" borderWidth="1px" borderColor="bluefrance" spacing="2w" paddingBottom="4w">
      <Text color="grey.800">
        Afin de mieux vous guider, merci de renseigner l’UAI de l’organisme dont vous désirez consulter les données
      </Text>
      <Field name="uai_organisme">
        {({ field, meta }) => (
          <FormControl isRequired isInvalid={meta.error && meta.touched}>
            <FormLabel color="grey.800">UAI de l&apos;organisme :</FormLabel>
            <Text fontSize="omega" color="grey.600">
              Une UAI au format valide est composée de 7 chiffres et 1 lettre
            </Text>
            <Input marginTop="2w" {...field} id={field.name} placeholder="Ex : 0011171T" />
            <FormErrorMessage marginTop="1w">
              <Box
                as="i"
                marginTop="1.5px"
                fontSize="16px"
                marginRight="1v"
                className="ri-alert-line"
                color="redmarianne"
              />
              {meta.error}
            </FormErrorMessage>
            <Button onClick={() => checkUai(meta.error, field.value)} width="20%" marginTop="2w" variant="primary">
              Vérifier
            </Button>
          </FormControl>
        )}
      </Field>
    </Stack>
  );
};

AskUniqueURLAskUaiSection.propTypes = {
  setUaiFound: PropTypes.func.isRequired,
  setUaiNotFound: PropTypes.func.isRequired,
};
export default AskUniqueURLAskUaiSection;
