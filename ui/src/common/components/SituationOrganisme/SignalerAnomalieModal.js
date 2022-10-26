import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Modal,
  ModalBody,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  Text,
  Textarea,
} from "@chakra-ui/react";
import { useFormik } from "formik";
import PropTypes from "prop-types";
import React, { useState } from "react";
import { useMutation, useQueryClient } from "react-query";
import * as Yup from "yup";

import { postSignalementAnomalie } from "../../api/partageSimplifieApi.js";
import { QUERY_KEYS } from "../../constants/queryKeys";
import useAuth from "../../hooks/useAuth";
import AlertBlock from "../AlertBlock/AlertBlock";
import ModalClosingButton from "../ModalClosingButton/ModalClosingButton";

const SignalerAnomalieModal = ({ isOpen, onClose }) => {
  const queryClient = useQueryClient();
  const [isSent, setIsSent] = useState(false);
  const { auth } = useAuth();

  const createSignalementAnomalie = useMutation(
    (newAnomalie) => {
      return postSignalementAnomalie(newAnomalie);
    },
    {
      onSuccess() {
        queryClient.invalidateQueries([QUERY_KEYS.SIGNALEMENT_ANOMALIE]);
        setIsSent(true);
      },
    }
  );
  const { values, handleChange, handleSubmit, errors } = useFormik({
    initialValues: {
      email: "",
      message: "",
    },
    validationSchema: Yup.object().shape({
      message: Yup.string().required("Requis"),
    }),
    onSubmit: ({ message }) => {
      const email = auth?.sub;
      createSignalementAnomalie.mutateAsync({ message, email });
    },
  });
  return (
    <Modal isOpen={isOpen} onClose={onClose} size="4xl">
      <ModalOverlay />
      <ModalContent borderRadius="0">
        <ModalHeader marginTop="2w" paddingX="4w" fontWeight="700" color="grey.800" fontSize="alpha" textAlign="left">
          <Box as="i" className="ri-arrow-right-line" marginRight="3v" verticalAlign="middle" />
          <Box as="span" verticalAlign="middle">
            Signaler une anomalie
          </Box>
        </ModalHeader>
        <ModalClosingButton />
        <ModalBody paddingX="12w" color="#161616" paddingBottom="10w">
          <Box padding="4w">
            {!isSent ? (
              <>
                <FormControl isRequired isInvalid={errors.nom_etablissement}>
                  <FormLabel>Veuillez préciser l’anomalie ou votre remarque :</FormLabel>
                  <Textarea value={values.nom_etablissement} onChange={handleChange} name="message" minHeight="129px" />
                </FormControl>
                <Button
                  onClick={handleSubmit}
                  type="submit"
                  variant="primary"
                  marginTop="4w"
                  display="block"
                  marginLeft="auto"
                >
                  Envoyer
                </Button>
              </>
            ) : (
              <AlertBlock>
                <Text fontSize="gamma" color="#161616" fontWeight="bold">
                  Merci pour votre message.
                </Text>
                <Text>L’équipe du Tableau de bord vous recontactera.</Text>
              </AlertBlock>
            )}
          </Box>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

SignalerAnomalieModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
};

export default SignalerAnomalieModal;
