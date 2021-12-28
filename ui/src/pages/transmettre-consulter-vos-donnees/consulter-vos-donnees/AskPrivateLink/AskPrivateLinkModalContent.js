import {
  Box,
  Button,
  Flex,
  FormControl,
  FormErrorMessage,
  FormLabel,
  Input,
  ModalBody,
  ModalFooter,
  Stack,
  Text,
} from "@chakra-ui/react";
import { Field, Form, Formik } from "formik";
import PropTypes from "prop-types";
import React from "react";
import * as Yup from "yup";

import { uaiRegex } from "../../../../common/domain/uai";
import withSubmitPrivateLinkDemand, { SUBMIT_STATE } from "./withSubmitPrivateLinkDemand";

const formInitialValues = { nom_organisme: "", uai_organisme: "", code_postal_organisme: "", email_demandeur: "" };

const SuccessMessage = () => {
  return (
    <ModalBody paddingX="8w" marginBottom="5w">
      <Stack paddingX="4w" paddingY="3w" borderWidth="1px" borderColor="bluefrance" spacing="1w">
        <Flex fontWeight="700" fontSize="beta" color="grey.800" alignItems="center">
          <Box as="i" fontSize="alpha" textColor="bluefrance" className="ri-checkbox-circle-fill" />
          <Text paddingLeft="2w">Votre demande a bien été envoyée !</Text>
        </Flex>
        <Text textAlign="center" color="grey.800">
          Vous recevrez votre lien d&apos;accès par mail sous 72h
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
          Merci de réessayer ultérieurement.
        </Text>
      </Stack>
    </ModalBody>
  );
};

const AskPrivateLinkModalContent = ({ onClose, sendPrivateLinkDemand, submitState }) => {
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
      {({ isSubmitting }) => (
        <Form>
          <ModalBody paddingX="8w" marginBottom="5w">
            <Stack paddingX="4w" paddingY="5w" borderWidth="1px" borderColor="bluefrance" spacing="4w">
              <Field name="nom_organisme">
                {({ field, meta }) => (
                  <FormControl isRequired isInvalid={meta.error && meta.touched}>
                    <FormLabel color="grey.800">Nom de votre organisme</FormLabel>
                    <Input {...field} id={field.name} placeholder="Précisez ici..." />
                    <FormErrorMessage>{meta.error}</FormErrorMessage>
                  </FormControl>
                )}
              </Field>
              <Field name="uai_organisme">
                {({ field, meta }) => (
                  <FormControl isRequired isInvalid={meta.error && meta.touched}>
                    <FormLabel color="grey.800">UAI de l&apos;organisme</FormLabel>
                    <Input {...field} id={field.name} placeholder="Ex : 0011171T" />
                    <FormErrorMessage>{meta.error}</FormErrorMessage>
                  </FormControl>
                )}
              </Field>
              <Field name="code_postal_organisme">
                {({ field, meta }) => (
                  <FormControl isRequired isInvalid={meta.error && meta.touched}>
                    <FormLabel color="grey.800">Code postal</FormLabel>
                    <Input {...field} id={field.name} placeholder="Ex : 75016" />
                    <FormErrorMessage>{meta.error}</FormErrorMessage>
                  </FormControl>
                )}
              </Field>
              <Field name="email_demandeur">
                {({ field, meta }) => (
                  <FormControl isRequired isInvalid={meta.error && meta.touched}>
                    <FormLabel color="grey.800">Email de la personne faisant la demande</FormLabel>
                    <Input {...field} id={field.name} placeholder="exemple@mail.fr" />
                    <FormErrorMessage>{meta.error}</FormErrorMessage>
                  </FormControl>
                )}
              </Field>
            </Stack>
          </ModalBody>
          <Box boxShadow="dark-lg">
            <ModalFooter>
              <Button variant="secondary" type="button" marginRight="2w" onClick={onClose}>
                Annuler
              </Button>
              <Button type="submit" variant="primary" isLoading={isSubmitting}>
                Envoyer
              </Button>
            </ModalFooter>
          </Box>
        </Form>
      )}
    </Formik>
  );
};

AskPrivateLinkModalContent.propTypes = {
  sendPrivateLinkDemand: PropTypes.func.isRequired,
  submitState: PropTypes.oneOf(Object.values(SUBMIT_STATE)).isRequired,
  onClose: PropTypes.func.isRequired,
};

export default withSubmitPrivateLinkDemand(AskPrivateLinkModalContent);
