import { Button, Input, useToast } from "@chakra-ui/react";
import PropTypes from "prop-types";
import React from "react";
import { useMutation } from "react-query";

import { postGetUserUpdatePasswordUrl } from "../../common/api/tableauDeBord";

const GetUpdatePasswordUrlButton = ({ username }) => {
  const toast = useToast();
  const { data, isLoading, mutate } = useMutation(
    () => {
      return postGetUserUpdatePasswordUrl(username);
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
    <Button size="sm" variant="secondary" isLoading={isLoading} onClick={mutate}>
      Générer lien de modification de mot de passe
    </Button>
  );
};

GetUpdatePasswordUrlButton.propTypes = {
  username: PropTypes.string.isRequired,
};

export default GetUpdatePasswordUrlButton;
