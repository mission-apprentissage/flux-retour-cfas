import { Box, ModalCloseButton } from "@chakra-ui/react";
import React from "react";

const ModalClosingButton = () => {
  return (
    <ModalCloseButton width="80px">
      fermer
      <Box paddingLeft="1w" as="i" className="ri-close-line" />
    </ModalCloseButton>
  );
};

export default ModalClosingButton;
