import { Box, Text } from "@chakra-ui/react";
import React from "react";

const SuccessBlock = () => {
  return (
    <Box p="8w" borderColor="bluefrance" border="1px solid" maxWidth="640px">
      <Text fontSize="beta" fontWeight="700" color="grey.800">
        <Box as="i" className="ri-checkbox-circle-fill" marginRight="1w" color="bluefrance" verticalAlign="middle" />
        Votre demande a bien été envoyée !
      </Text>
    </Box>
  );
};

export default SuccessBlock;
