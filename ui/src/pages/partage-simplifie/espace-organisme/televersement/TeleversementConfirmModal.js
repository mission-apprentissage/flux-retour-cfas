import {
  Box,
  Button,
  HStack,
  Modal,
  ModalBody,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  Stack,
  Text,
} from "@chakra-ui/react";
import PropTypes from "prop-types";
import React from "react";

import ModalClosingButton from "../../../../common/components/ModalClosingButton/ModalClosingButton.js";
import { UPLOAD_STATES } from "./UploadStates.js";

const TeleversementConfirmModal = ({ isOpen, onClose, formState, file = null, submitUpload }) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} size="2xl">
      <ModalOverlay />
      <ModalContent borderRadius="0">
        <ModalHeader marginTop="2w" paddingX="8w" fontWeight="700" color="grey.800" fontSize="gamma" textAlign="left">
          <Box as="i" className="ri-arrow-right-line" marginRight="3v" verticalAlign="middle" />
          <Box as="span" verticalAlign="middle">
            Déposer un fichier
          </Box>
        </ModalHeader>
        <ModalClosingButton />
        <ModalBody paddingX="8w" marginBottom="10w">
          {formState === UPLOAD_STATES.INITIAL && (
            <Box padding="4w" background="white" borderColor="bluefrance" border="1px solid" minWidth="420px">
              <Stack spacing="4w">
                <Text color="grey.800" textAlign="center">
                  <strong>Vous allez déposer le fichier {file?.name || "NC"}</strong>
                </Text>
                <HStack alignSelf="center">
                  <Button variant="secondary" onClick={onClose}>
                    Annuler
                  </Button>
                  <Button variant="primary" onClick={submitUpload}>
                    Confirmer
                  </Button>
                </HStack>
              </Stack>
            </Box>
          )}

          {formState === UPLOAD_STATES.LOADING && (
            <Box padding="4w" background="white" borderColor="bluefrance" border="1px solid" minWidth="420px">
              <Stack spacing="4w" fontSize="epsilon">
                <Box alignSelf="center">
                  <Box as="i" color="bluefrance" fontSize="beta" className="ri-timer-fill" />
                </Box>
                <Text color="grey.800" textAlign="center">
                  <strong>Analyse du fichier en cours ...</strong>
                </Text>
                <Text color="grey.800" textAlign="center">
                  Veuillez patienter.
                </Text>
              </Stack>
            </Box>
          )}
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

TeleversementConfirmModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  formState: PropTypes.string.isRequired,
  file: PropTypes.object,
  submitUpload: PropTypes.func.isRequired,
};

export default TeleversementConfirmModal;
