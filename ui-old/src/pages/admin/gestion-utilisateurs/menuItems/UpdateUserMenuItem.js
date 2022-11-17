import { Box, MenuItem, useDisclosure } from "@chakra-ui/react";
import PropTypes from "prop-types";
import React from "react";

import UpdateUserModal from "../updateUser/UpdateUserModal";

const UpdateUserMenuItem = ({ userId }) => {
  const updateUserModal = useDisclosure();
  return (
    <>
      <UpdateUserModal userId={userId} isOpen={updateUserModal.isOpen} onClose={updateUserModal.onClose} />
      <MenuItem size="sm" variant="secondary" onClick={updateUserModal.onOpen}>
        <Box as="i" className="ri-edit-box-line" marginRight="1w" />
        Modifier l&apos;utilisateur
      </MenuItem>
    </>
  );
};
UpdateUserMenuItem.propTypes = {
  userId: PropTypes.string.isRequired,
};

export default UpdateUserMenuItem;
