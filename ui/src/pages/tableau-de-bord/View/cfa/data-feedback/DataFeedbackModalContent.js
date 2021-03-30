import {
  Button,
  FormControl,
  FormErrorMessage,
  FormLabel,
  Input,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Radio,
  RadioGroup,
  Stack,
  Text,
  Textarea,
} from "@chakra-ui/react";
import { Field, Form, Formik } from "formik";
import PropTypes from "prop-types";
import React from "react";
import * as Yup from "yup";

import withSubmitDataFeedback, { SUBMIT_STATE } from "./withSubmitDataFeedback";

const formInitialValues = { email: "", dataIsValid: null, details: "" };

const SuccessMessage = () => {
  return (
    <ModalContent>
      <ModalHeader marginY="2w" fontWeight="400" fontSize="beta" textAlign="center">
        Merci !
      </ModalHeader>
      <ModalCloseButton />
      <ModalBody paddingX="8w" marginBottom="5w">
        <Text textAlign="center" color="grey.800">
          Nous avons bien pris en compte votre retour.
        </Text>
      </ModalBody>
    </ModalContent>
  );
};

const DataFeedbackModalContent = ({ sendDataFeedback, submitState }) => {
  if (submitState === SUBMIT_STATE.success) {
    return <SuccessMessage />;
  }

  return (
    <ModalContent>
      <Formik
        initialValues={formInitialValues}
        validationSchema={Yup.object().shape({
          email: Yup.string().email("Format d'email invalide").required("Requis"),
          dataIsValid: Yup.string().required("Requis"),
          details: Yup.string().required("Requis"),
        })}
        onSubmit={sendDataFeedback}
      >
        {({ isSubmitting }) => (
          <Form>
            <ModalHeader marginY="2w" fontWeight="400" fontSize="beta" textAlign="center">
              Validation des données
            </ModalHeader>
            <ModalCloseButton />
            <ModalBody paddingX="8w" marginBottom="5w">
              <Stack spacing="4w">
                <Field name="email">
                  {({ field, meta }) => (
                    <FormControl isRequired isInvalid={meta.error && meta.touched}>
                      <FormLabel>Email</FormLabel>
                      <Input {...field} id={field.name} placeholder="exemple@mail.fr" />
                      <FormErrorMessage>{meta.error}</FormErrorMessage>
                    </FormControl>
                  )}
                </Field>
                <Field name="dataIsValid">
                  {({ field }) => (
                    <FormControl isRequired>
                      <FormLabel>Les données présentées vous paraissent-elles valides ?</FormLabel>
                      <RadioGroup {...field}>
                        <Stack direction="row">
                          <Radio {...field} value="1">
                            Oui
                          </Radio>
                          <Radio {...field} value="0">
                            Non
                          </Radio>
                        </Stack>
                      </RadioGroup>
                    </FormControl>
                  )}
                </Field>
                <Field name="details">
                  {({ field, meta }) => (
                    <FormControl isRequired isInvalid={meta.error && meta.touched}>
                      <FormLabel>Détails</FormLabel>
                      <Textarea {...field} id={field.name} placeholder="Le nombre d'apprentis est censé être 15" />
                      <FormErrorMessage>{meta.error}</FormErrorMessage>
                    </FormControl>
                  )}
                </Field>
              </Stack>
            </ModalBody>

            <ModalFooter>
              <Button type="submit" variant="primary" isLoading={isSubmitting}>
                Envoyer
              </Button>
            </ModalFooter>
          </Form>
        )}
      </Formik>
    </ModalContent>
  );
};

DataFeedbackModalContent.propTypes = {
  sendDataFeedback: PropTypes.func.isRequired,
  submitState: PropTypes.oneOf(Object.values(SUBMIT_STATE)).isRequired,
};

export default withSubmitDataFeedback(DataFeedbackModalContent);
