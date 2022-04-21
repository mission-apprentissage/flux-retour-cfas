import { Box, Modal, ModalContent, ModalHeader, ModalOverlay } from "@chakra-ui/react";
import PropTypes from "prop-types";
import React from "react";

import ModalClosingButton from "../../../../common/components/ModalClosingButton/ModalClosingButton";
import AskPrivateLinkModalContent from "./AskUniqueURLModalContent";

const AskUniqueURLModal = ({ isOpen, onClose }) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} size="2xl">
      <ModalOverlay />
      <ModalContent borderRadius="0">
        <ModalHeader marginTop="2w" paddingX="8w" fontWeight="700" color="grey.800" fontSize="alpha" textAlign="left">
          <Box as="i" className="ri-arrow-right-line" marginRight="3v" verticalAlign="middle" />
          <Box as="span" verticalAlign="middle">
            Demander votre URL unique
          </Box>
        </ModalHeader>
        <ModalClosingButton />
        <AskPrivateLinkModalContent onClose={onClose} />
      </ModalContent>
    </Modal>
  );
};

AskUniqueURLModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
};

export default AskUniqueURLModal;
