import { Box, Modal, ModalContent, ModalHeader, ModalOverlay } from "@chakra-ui/react";
import PropTypes from "prop-types";
import React from "react";
import { useMutation, useQueryClient } from "react-query";

import { fetchCreateUser } from "../../common/api/tableauDeBord";
import ModalClosingButton from "../../common/components/ModalClosingButton/ModalClosingButton";
import CreateUserForm from "./CreateUserForm";

const CreateUserModal = ({ isOpen, onClose }) => {
  const queryClient = useQueryClient();
  const createUser = useMutation(
    (newUser) => {
      return fetchCreateUser(newUser);
    },
    {
      onSuccess() {
        queryClient.invalidateQueries(["users"]);
        onClose();
      },
    }
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="2xl">
      <ModalOverlay />
      <ModalContent borderRadius="0">
        <ModalHeader marginTop="2w" paddingX="8w" fontWeight="700" color="grey.800" fontSize="alpha" textAlign="left">
          <Box as="i" className="ri-arrow-right-line" marginRight="3v" verticalAlign="middle" />
          <Box as="span" verticalAlign="middle">
            Créer un utilisateur
          </Box>
        </ModalHeader>
        <ModalClosingButton />
        <CreateUserForm
          onSubmit={async (data) => {
            await createUser.mutateAsync(data);
          }}
        />
      </ModalContent>
    </Modal>
  );
};

CreateUserModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
};

export default CreateUserModal;
