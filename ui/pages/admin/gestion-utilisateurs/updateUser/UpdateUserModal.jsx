import { Box, Modal, ModalContent, ModalHeader, ModalOverlay } from "@chakra-ui/react";
import PropTypes from "prop-types";
import React from "react";
import { useMutation, useQueryClient } from "react-query";

import { putUser } from "../../../../common/api/tableauDeBord";
import { QUERY_KEYS } from "../../../../common/constants/queryKeys";
import ModalClosingButton from "../../../../components/ModalClosingButton/ModalClosingButton";
import UpdateUserForm from "./UpdateUserForm";

const UpdateUserModal = ({ userId, isOpen, onClose }) => {
  const queryClient = useQueryClient();
  const updateUser = useMutation(
    (updatedUser) => {
      return putUser(userId, updatedUser);
    },
    {
      onSuccess() {
        // invalidate users query so react-query refetch the list for us
        // see https://react-query.tanstack.com/guides/query-invalidation#query-matching-with-invalidatequeries
        queryClient.invalidateQueries([QUERY_KEYS.SEARCH_USERS]);
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
            Mettre à jour l&apos;utilisateur
          </Box>
        </ModalHeader>
        <ModalClosingButton />
        <UpdateUserForm
          userId={userId}
          onSubmit={async (data) => {
            await updateUser.mutateAsync(data);
          }}
        />
      </ModalContent>
    </Modal>
  );
};

UpdateUserModal.propTypes = {
  userId: PropTypes.string.isRequired,
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
};

export default UpdateUserModal;
