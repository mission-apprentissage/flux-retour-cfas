import { Box, Button, useToast } from "@chakra-ui/react";
import PropTypes from "prop-types";
import React from "react";

const CopyCfaPrivateLinkButton = ({ link }) => {
  const toast = useToast();

  const copyLinkAndToast = () => {
    navigator.clipboard.writeText(link);
    toast({
      title: "Lien public du CFA copié.",
      status: "info",
      duration: 9000,
      isClosable: true,
      position: "top-right",
    });
  };

  return (
    <Button variant="link" onClick={() => copyLinkAndToast()}>
      <Box as="i" className="ri-link" marginRight="1v" paddingTop="1px" />
      <p>Copier l&apos;URL d&apos;accès</p>
    </Button>
  );
};

CopyCfaPrivateLinkButton.propTypes = {
  link: PropTypes.string.isRequired,
};

export default CopyCfaPrivateLinkButton;
