import { Box, Input, MenuItem, useToast } from "@chakra-ui/react";
import PropTypes from "prop-types";
import React from "react";
import { useMutation } from "react-query";

import { postGetUserUpdatePasswordUrl } from "../../../../../common/api/partageSimplifieApi.js";

const GetUpdatePasswordUrlMenuItem = ({ email }) => {
  const toast = useToast();
  const { data, mutate } = useMutation(
    () => {
      return postGetUserUpdatePasswordUrl(email);
    },
    {
      onSuccess(data) {
        const url = data.passwordUpdateUrl;
        navigator.clipboard.writeText(url);
        toast({
          title: "Lien de modification de mot de passe copié.",
          status: "info",
          duration: 9000,
          isClosable: true,
          position: "top-right",
        });
      },
    }
  );

  return data ? (
    <Input isDisabled value={data.passwordUpdateUrl} />
  ) : (
    <MenuItem size="sm" variant="secondary" onClick={mutate}>
      <Box as="i" className="ri-link" marginRight="1w" />
      Générer lien de modification de mot de passe
    </MenuItem>
  );
};

GetUpdatePasswordUrlMenuItem.propTypes = {
  email: PropTypes.string.isRequired,
};

export default GetUpdatePasswordUrlMenuItem;
