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

import { AlertErrorBlock } from "../../../../../../common/components/index.js";
import ModalClosingButton from "../../../../../../common/components/ModalClosingButton/ModalClosingButton.js";
import OFConfirmModalExistingAccountAlert from "./OFConfirmModalExistingAccountAlert.js";
import { VERIFY_UAI_SIRET_EXISTING_STATE } from "./useSubmitVerifyUaiSiretExisting.js";

const OFConfirmModal = ({ isOpen, onClose, formState, submitVerifyUaiSiretExisting }) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} size="2xl">
      <ModalOverlay />
      <ModalContent borderRadius="0">
        <ModalHeader marginTop="2w" paddingX="8w" fontWeight="700" color="grey.800" fontSize="gamma" textAlign="left">
          <Box as="i" className="ri-arrow-right-line" marginRight="3v" verticalAlign="middle" />
          <Box as="span" verticalAlign="middle">
            Confirmer votre organisme de formation
          </Box>
        </ModalHeader>
        <ModalClosingButton />
        <ModalBody paddingX="8w" marginBottom="10w">
          {formState === VERIFY_UAI_SIRET_EXISTING_STATE.INITIAL && (
            <Box padding="4w" background="white" borderColor="bluefrance" border="1px solid" minWidth="420px">
              <Stack spacing="4w">
                <Text color="grey.800" textAlign="center">
                  <strong>Vous confirmez que les numéros d’UAI et SIRET correspondent à votre établissement ?</strong>
                </Text>
                <HStack alignSelf="center">
                  <Button variant="secondary" onClick={onClose}>
                    Annuler
                  </Button>
                  <Button variant="primary" onClick={submitVerifyUaiSiretExisting}>
                    Confirmer
                  </Button>
                </HStack>
              </Stack>
            </Box>
          )}
          {formState === VERIFY_UAI_SIRET_EXISTING_STATE.ACCOUNT_EXISTANT && <OFConfirmModalExistingAccountAlert />}
          {formState === VERIFY_UAI_SIRET_EXISTING_STATE.ACCOUNT_INEXISTANT && <p>GO GO</p>}
          {formState === VERIFY_UAI_SIRET_EXISTING_STATE.ERROR && <AlertErrorBlock width="100%" />}
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

OFConfirmModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  submitVerifyUaiSiretExisting: PropTypes.func.isRequired,
  formState: PropTypes.string.isRequired,
};

export default OFConfirmModal;
