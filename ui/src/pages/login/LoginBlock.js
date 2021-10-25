import { Box, Text } from "@chakra-ui/react";
import PropTypes from "prop-types";
import React from "react";

import LoginForm from "./LoginForm";

const LoginBlock = ({ onSubmit }) => {
  return (
    <Box p="8w" borderColor="bluefrance" border="1px solid" maxWidth="640px">
      <Text fontSize="beta" fontWeight="700" color="grey.800" marginBottom="3w">
        Pour des raisons de confidentialité cette page n&apos;est plus accessible.
      </Text>
      <Text fontSize="gamma" color="grey.800" marginBottom="2w">
        Merci de vous identifier pour consulter les données.
      </Text>
      <LoginForm onSubmit={onSubmit} />
    </Box>
  );
};

LoginBlock.propTypes = {
  onSubmit: PropTypes.func.isRequired,
};

export default LoginBlock;
