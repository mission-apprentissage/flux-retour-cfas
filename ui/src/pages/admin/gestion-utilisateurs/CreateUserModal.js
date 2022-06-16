import { Box, Modal, ModalContent, ModalHeader, ModalOverlay } from "@chakra-ui/react";
import PropTypes from "prop-types";
import React from "react";
import { useMutation, useQueryClient } from "react-query";

import { postCreateUser } from "../../../common/api/tableauDeBord";
import ModalClosingButton from "../../../common/components/ModalClosingButton/ModalClosingButton";
import { QUERY_KEY } from "../../../common/constants/queryKey";
import CreateUserForm from "./CreateUserForm";

const CreateUserModal = ({ isOpen, onClose }) => {
  const queryClient = useQueryClient();
  const createUser = useMutation(
    (newUser) => {
      return postCreateUser(newUser);
    },
    {
      onSuccess() {
        // invalidate users query so react-query refetch the list for us
        // see https://react-query.tanstack.com/guides/query-invalidation#query-matching-with-invalidatequeries
        queryClient.invalidateQueries([QUERY_KEY.users]);
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
