import { Box, Modal, ModalBody, ModalContent, ModalHeader, ModalOverlay } from "@chakra-ui/react";
import PropTypes from "prop-types";
import React from "react";

import ModalClosingButton from "../../../../common/components/ModalClosingButton/ModalClosingButton";
import useLoginPartageSimplifie from "../../../../common/hooks/useLoginPartageSimplifie";
import DemandeActivationCompteBlock from "./DemandeActivationCompteBlock.js";

const DemandeActivationCompte = ({ isOpen, onClose }) => {
  const [login] = useLoginPartageSimplifie();

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="2xl">
      <ModalOverlay />
      <ModalContent borderRadius="0">
        <ModalHeader marginTop="2w" paddingX="8w" fontWeight="700" color="grey.800" fontSize="alpha" textAlign="left">
          <Box as="i" className="ri-arrow-right-line" marginRight="3v" verticalAlign="middle" />
          <Box as="span" verticalAlign="middle">
            Activer mon compte
          </Box>
        </ModalHeader>
        <ModalClosingButton />
        <ModalBody paddingX="8w" marginBottom="10w">
          <DemandeActivationCompteBlock onSubmit={login} />
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

DemandeActivationCompte.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
};

export default DemandeActivationCompte;
