import {
  Box,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  Text,
} from "@chakra-ui/react";
import PropTypes from "prop-types";
import React from "react";

import DemandeAccesForm from "./DemandeAccesForm";
import useDemandeAccesSubmit, { REQUEST_STATE } from "./useDemandeAccesSubmit";

const RequestAccessModal = ({ isOpen, onClose }) => {
  const [submitState, submit] = useDemandeAccesSubmit();

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
        <ModalHeader marginY="2w" fontWeight="700" fontSize="alpha" textAlign="center" color="grey.800">
          Demander mes identifiants
        </ModalHeader>
        <ModalCloseButton />
        {content}
      </ModalContent>
    </Modal>
  );
};

RequestAccessModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
};

export default RequestAccessModal;
