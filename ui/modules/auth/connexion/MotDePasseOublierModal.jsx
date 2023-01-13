import {
  Box,
  Button,
  Flex,
  FormControl,
  FormErrorMessage,
  FormLabel,
  Input,
  Modal,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  Text,
} from "@chakra-ui/react";
import { Field, Form, Formik } from "formik";
import React from "react";
import * as Yup from "yup";
import { _post } from "../../../common/httpClient";
import { getAuthServerSideProps } from "../../../common/SSR/getAuthServerSideProps";
import ModalClosingButton from "../../../components/ModalClosingButton/ModalClosingButton";
import { Checkbox } from "../../../theme/components/icons";

export const getServerSideProps = async (context) => ({ props: { ...(await getAuthServerSideProps(context)) } });

const MotDePasseOublierModal = ({ isOpen, onClose, step, setStep }) => {
  const resetPassword = async (values, { setStatus }) => {
    try {
      await _post("/api/v1/password/forgotten-password", { ...values });
      setStatus({ message: "Un email vous a été envoyé." });
      setStep(1);
    } catch (e) {
      console.error(e);
      setStatus({ error: e.prettyMessage });
    }
  };
  const title = "Mot de passe oublié";

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="4xl">
      <ModalOverlay />
      <ModalContent borderRadius="0">
        <ModalHeader marginTop="2w" paddingX="8w" fontWeight="700" color="grey.800" fontSize="alpha" textAlign="left">
          <Box as="i" className="ri-arrow-right-line" marginRight="3v" verticalAlign="middle" fontSize="24px" />
          <Box as="span" verticalAlign="middle" fontSize="24px">
            {title}
          </Box>
        </ModalHeader>
        <ModalClosingButton />
        {step === 0 ? (
          <Flex justifyContent="center" mb="10">
            <Box width={["auto", "40rem"]} border="1px solid" borderColor="bluefrance">
              <Box p="5">
                <Formik
                  initialValues={{
                    username: "",
                  }}
                  validationSchema={Yup.object().shape({
                    username: Yup.string().required("Veuillez saisir un email"),
                  })}
                  onSubmit={resetPassword}
                >
                  {({ status = {} }) => {
                    return (
                      <Form>
                        <Field name="username">
                          {({ field, meta }) => {
                            return (
                              <FormControl isRequired isInvalid={meta.error && meta.touched} marginBottom="2w">
                                <FormLabel>Votre email :</FormLabel>
                                <Input {...field} id={field.name} />
                                <FormErrorMessage>{meta.error}</FormErrorMessage>
                              </FormControl>
                            );
                          }}
                        </Field>
                        <Button w="100%" variant="primary" type={"submit"}>
                          Recevoir un email de réinitialisation
                        </Button>
                        {status.error && (
                          <Text color="error" mt={2}>
                            {status.error}
                          </Text>
                        )}
                        {status.message && (
                          <Text color="info" mt={2}>
                            {status.message}
                          </Text>
                        )}
                      </Form>
                    );
                  }}
                </Formik>
              </Box>
            </Box>
          </Flex>
        ) : (
          <Flex justifyContent="center" mb="10">
            <Flex width={["auto", "40rem"]} border="1px solid" borderColor="flatsuccess">
              <Box bg="flatsuccess" p="2">
                <Checkbox color="white" />
              </Box>
              <Box p="2" ml="4">
                <Text fontWeight={700} fontSize="20px">
                  Merci.
                </Text>
                <Text>Vous allez recevoir un lien vous permettant de réinitialiser votre mot de passe.</Text>
              </Box>
            </Flex>
          </Flex>
        )}
      </ModalContent>
    </Modal>
  );
};

export default MotDePasseOublierModal;
