import { Box, Modal, ModalBody, ModalContent, ModalHeader, ModalOverlay, Text } from "@chakra-ui/react";
import PropTypes from "prop-types";
import React from "react";

import ModalClosingButton from "../../../components/ModalClosingButton/ModalClosingButton";
import DemandeAccesForm from "./AskIdentifiantsForm";
import useAskIdentifiantsSubmit, { REQUEST_STATE } from "./useAskIdentifiantsSubmit";

const AskIdentifiantsModal = ({ isOpen, onClose }) => {
  const [submitState, submit] = useAskIdentifiantsSubmit();

  const content =
    submitState === REQUEST_STATE.success ? (
      <ModalBody paddingX="8w" marginBottom="10w">
        <Box paddingY="5w" paddingX="4w" borderColor="bluefrance" border="1px solid">
          <Text fontSize="beta" fontWeight="700" color="grey.800">
            <Box
              as="i"
              className="ri-checkbox-circle-fill"
              marginRight="1w"
              color="bluefrance"
              verticalAlign="middle"
            />
            Votre demande a bien été envoyée !
          </Text>
        </Box>
      </ModalBody>
    ) : (
      <DemandeAccesForm onSubmit={submit} onClose={onClose} />
    );

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="2xl">
      <ModalOverlay />
      <ModalContent borderRadius="0">
        <ModalHeader marginTop="2w" paddingX="8w" fontWeight="700" color="grey.800" fontSize="alpha" textAlign="left">
          <Box as="i" className="ri-arrow-right-line" marginRight="3v" verticalAlign="middle" />
          <Box as="span" verticalAlign="middle">
            Demander mes identifiants
          </Box>
        </ModalHeader>
        <ModalClosingButton />
        {content}
      </ModalContent>
    </Modal>
  );
};

AskIdentifiantsModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
};

export default AskIdentifiantsModal;
