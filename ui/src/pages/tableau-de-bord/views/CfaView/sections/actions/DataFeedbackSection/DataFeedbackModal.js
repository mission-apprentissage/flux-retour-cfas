import { Box, Modal, ModalContent, ModalHeader, ModalOverlay } from "@chakra-ui/react";
import PropTypes from "prop-types";
import React from "react";

import ModalClosingButton from "../../../../../../../common/components/ModalClosingButton/ModalClosingButton";
import DataFeedbackModalContent from "./DataFeedbackModalContent";

const DataFeedbackModal = ({ isOpen, onClose, uai }) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} size="2xl">
      <ModalOverlay />
      <ModalContent borderRadius="0">
        <ModalHeader marginTop="2w" paddingX="8w" fontWeight="700" color="grey.800" fontSize="alpha" textAlign="left">
          <Box as="i" className="ri-arrow-right-line" marginRight="3v" verticalAlign="middle" />
          <Box as="span" verticalAlign="middle">
            Signaler une anomalie
          </Box>
        </ModalHeader>
        <ModalClosingButton />
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
