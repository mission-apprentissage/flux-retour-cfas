import {
  Button,
  FormControl,
  FormErrorMessage,
  FormLabel,
  Input,
  ModalBody,
  ModalCloseButton,
  ModalFooter,
  ModalHeader,
  Stack,
  Text,
  Textarea,
} from "@chakra-ui/react";
import { Field, Form, Formik } from "formik";
import PropTypes from "prop-types";
import React from "react";
import * as Yup from "yup";

import withSubmitDataFeedback, { SUBMIT_STATE } from "./withSubmitDataFeedback";

const formInitialValues = { email: "", details: "" };

const SuccessMessage = () => {
  return (
    <>
      <ModalHeader marginY="2w" fontWeight="400" fontSize="beta" textAlign="center">
        Merci !
      </ModalHeader>
      <ModalCloseButton />
      <ModalBody paddingX="8w" marginBottom="5w">
        <Text textAlign="center" color="grey.800">
          Nous avons bien pris en compte votre retour.
        </Text>
      </ModalBody>
    </>
  );
};

const ErrorMessage = () => {
  return (
    <>
      <ModalHeader marginY="2w" fontWeight="400" fontSize="beta" textAlign="center">
        Erreur
      </ModalHeader>
      <ModalCloseButton />
      <ModalBody paddingX="8w" marginBottom="5w">
        <Text textAlign="center" color="grey.800">
          Nous avons rencontré une erreur lors de la soumission de votre signalement. Merci de réessayer.
        </Text>
      </ModalBody>
    </>
  );
};

const DataFeedbackModalContent = ({ onClose, sendDataFeedback, submitState }) => {
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
        email: Yup.string().email("Format d'email invalide").required("Requis"),
        details: Yup.string().required("Requis"),
      })}
      onSubmit={sendDataFeedback}
    >
      {({ isSubmitting }) => (
        <Form>
          <ModalHeader marginY="2w" fontWeight="700" color="grey.800" fontSize="alpha" textAlign="center">
            Signaler une anomalie
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody paddingX="8w" marginBottom="5w">
            <Stack spacing="4w">
              <Field name="email">
                {({ field, meta }) => (
                  <FormControl isRequired isInvalid={meta.error && meta.touched}>
                    <FormLabel color="grey.800">Votre email</FormLabel>
                    <Input {...field} id={field.name} placeholder="exemple@mail.fr" />
                    <FormErrorMessage>{meta.error}</FormErrorMessage>
                  </FormControl>
                )}
              </Field>
              <Field name="details">
                {({ field, meta }) => (
                  <FormControl isRequired isInvalid={meta.error && meta.touched}>
                    <FormLabel color="grey.800">Détails</FormLabel>
                    <Textarea {...field} id={field.name} placeholder="Précisez ici..." />
                    <FormErrorMessage>{meta.error}</FormErrorMessage>
                  </FormControl>
                )}
              </Field>
            </Stack>
          </ModalBody>

          <ModalFooter>
            <Button variant="ghost" type="button" marginRight="2w" onClick={onClose}>
              Annuler
            </Button>
            <Button type="submit" variant="primary" isLoading={isSubmitting}>
              Envoyer
            </Button>
          </ModalFooter>
        </Form>
      )}
    </Formik>
  );
};

DataFeedbackModalContent.propTypes = {
  sendDataFeedback: PropTypes.func.isRequired,
  submitState: PropTypes.oneOf(Object.values(SUBMIT_STATE)).isRequired,
  onClose: PropTypes.func.isRequired,
};

export default withSubmitDataFeedback(DataFeedbackModalContent);
