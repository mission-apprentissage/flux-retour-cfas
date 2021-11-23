import { Modal, ModalContent, ModalOverlay } from "@chakra-ui/react";
import PropTypes from "prop-types";
import React from "react";

import AskAccessLinkModalContent from "./AskAccessLinkModalContent";

const AskAccessLinkModal = ({ isOpen, onClose }) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} size="2xl">
      <ModalOverlay />
      <ModalContent borderRadius="0">
        <AskAccessLinkModalContent onClose={onClose} />
      </ModalContent>
    </Modal>
  );
};

AskAccessLinkModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
};

export default AskAccessLinkModal;
