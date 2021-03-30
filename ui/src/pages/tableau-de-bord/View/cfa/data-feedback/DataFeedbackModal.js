import { Modal, ModalOverlay } from "@chakra-ui/react";
import PropTypes from "prop-types";
import React from "react";

import DataFeedbackModalContent from "./DataFeedbackModalContent";

const DataFeedbackModal = ({ isOpen, onClose, siret, refetchDataFeedback }) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} size="2xl">
      <ModalOverlay />
      <DataFeedbackModalContent siret={siret} refetchDataFeedback={refetchDataFeedback} />
    </Modal>
  );
};

DataFeedbackModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  siret: PropTypes.string.isRequired,
  refetchDataFeedback: PropTypes.func.isRequired,
};

export default DataFeedbackModal;
