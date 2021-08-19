import { Box, Flex, Text } from "@chakra-ui/react";
import PropTypes from "prop-types";
import React from "react";

const Alert = ({ children }) => {
  return (
    <Flex role="alert" border="1px solid" borderColor="warning" color="grey.800">
      <Flex alignItems="center" backgroundColor="warning" minWidth="41px" paddingLeft="10px">
        <Box as="i" className="ri-information-line" fontSize="gamma" color="white" />
      </Flex>
      <Text paddingY="1w" paddingLeft="2w" paddingRight="1w">
        {children}
      </Text>
    </Flex>
  );
};

Alert.propTypes = {
  children: PropTypes.node.isRequired,
};

export default Alert;
