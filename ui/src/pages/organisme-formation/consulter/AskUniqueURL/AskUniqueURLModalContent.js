import { Box, Flex, ModalBody, Stack, Text } from "@chakra-ui/react";
import { Form, Formik } from "formik";
import PropTypes from "prop-types";
import React, { useState } from "react";
import * as Yup from "yup";

import { uaiRegex } from "../../../../common/domain/uai";
import { AskUniqueURLAskUaiSection, AskUniqueURLUaiFound, AskUniqueURLUaiNotFound } from "./FormSections";
import withSubmitAskUniqueURL, { SUBMIT_STATE } from "./withSubmitAskUniqueURL";

const formInitialValues = { nom_organisme: "", uai_organisme: "", code_postal_organisme: "", email_demandeur: "" };

export const ASKURL_FORM_STATE = {
  askUai: "askUai",
  uaiFound: "uaiFound",
  uaiNotFound: "uaiNotFound",
};

const SuccessMessage = () => {
  return (
    <ModalBody paddingX="8w" marginBottom="5w">
      <Stack paddingX="4w" paddingY="3w" borderWidth="1px" borderColor="bluefrance" spacing="1w">
        <Flex fontWeight="700" fontSize="beta" color="grey.800" alignItems="center">
          <Box as="i" fontSize="alpha" textColor="bluefrance" className="ri-checkbox-circle-fill" />
          <Text paddingLeft="2w">Votre demande a bien été envoyée !</Text>
        </Flex>
        <Text textAlign="center" color="grey.800">
          Vous recevrez votre URL unique par mail sous 72h
        </Text>
      </Stack>
    </ModalBody>
  );
};

const ErrorMessage = () => {
  return (
    <ModalBody paddingX="8w" marginBottom="5w">
      <Stack paddingX="4w" paddingY="3w" borderWidth="1px" borderColor="bluefrance" spacing="1w">
        <Flex fontWeight="700" fontSize="beta" color="grey.800" alignItems="center">
          <Box as="i" fontSize="alpha" textColor="bluefrance" className="ri-checkbox-circle-fill" />
          <Text paddingLeft="2w">Nous avons rencontré une erreur lors de la soumission de votre demande.</Text>
        </Flex>
        <Text textAlign="center" color="grey.800">
          Merci de réessayer ultérieuwent.
        </Text>
      </Stack>
    </ModalBody>
  );
};

const AskUniqueURLModalContent = ({ sendPrivateLinkDemand, submitState }) => {
  const [formState, setFormState] = useState(ASKURL_FORM_STATE.askUai);

  if (submitState === SUBMIT_STATE.success) {
    return <SuccessMessage />;
  }
  if (submitState === SUBMIT_STATE.fail) {
    return <ErrorMessage />;
  }

  return (
    <Formik
      initialValues={formInitialValues}
      validationSchema={Yup.object().shape({
        nom_organisme: Yup.string().required("Requis"),
        uai_organisme: Yup.string().matches(uaiRegex, "UAI invalide").required("Requis"),
        code_postal_organisme: Yup.string()
          .matches(/^[0-9]{5}$/, "Code postal invalide")
          .required("Requis"),
        email_demandeur: Yup.string().email("Format d'email invalide").required("Requis"),
      })}
      onSubmit={sendPrivateLinkDemand}
    >
      {({ values, isSubmitting }) => (
        <Form>
          <ModalBody paddingX="8w" marginBottom="5w">
            {formState === ASKURL_FORM_STATE.askUai && (
              <AskUniqueURLAskUaiSection
                setUaiFound={() => setFormState(ASKURL_FORM_STATE.uaiFound)}
                setUaiNotFound={() => setFormState(ASKURL_FORM_STATE.uaiNotFound)}
              />
            )}
            {formState === ASKURL_FORM_STATE.uaiFound && (
              <AskUniqueURLUaiFound
                uai_organisme={values.uai_organisme}
                isSubmitting={isSubmitting}
                setPreviousFormStep={() => setFormState(ASKURL_FORM_STATE.askUai)}
              />
            )}
            {formState === ASKURL_FORM_STATE.uaiNotFound && (
              <AskUniqueURLUaiNotFound
                uai_organisme={values.uai_organisme}
                isSubmitting={isSubmitting}
                setPreviousFormStep={() => setFormState(ASKURL_FORM_STATE.askUai)}
              />
            )}
          </ModalBody>
        </Form>
      )}
    </Formik>
  );
};

AskUniqueURLModalContent.propTypes = {
  sendPrivateLinkDemand: PropTypes.func.isRequired,
  submitState: PropTypes.oneOf(Object.values(SUBMIT_STATE)).isRequired,
};

export default withSubmitAskUniqueURL(AskUniqueURLModalContent);
