import { Modal, ModalContent, ModalOverlay } from "@chakra-ui/react";
import PropTypes from "prop-types";
import React from "react";

import DataFeedbackModalContent from "./DataFeedbackModalContent";

const DataFeedbackModal = ({ isOpen, onClose, siret }) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} size="2xl">
      <ModalOverlay />
      <ModalContent borderRadius="0">
        <DataFeedbackModalContent siret={siret} onClose={onClose} />
      </ModalContent>
    </Modal>
  );
};

DataFeedbackModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  siret: PropTypes.string.isRequired,
};

export default DataFeedbackModal;
