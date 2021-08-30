import { Modal, ModalContent, ModalOverlay } from "@chakra-ui/react";
import PropTypes from "prop-types";
import React from "react";

import DataFeedbackModalContent from "./DataFeedbackModalContent";

const DataFeedbackModal = ({ isOpen, onClose, uai }) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} size="2xl">
      <ModalOverlay />
      <ModalContent borderRadius="0">
        <DataFeedbackModalContent uai={uai} onClose={onClose} />
      </ModalContent>
    </Modal>
  );
};

DataFeedbackModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  uai: PropTypes.string.isRequired,
};

export default DataFeedbackModal;
