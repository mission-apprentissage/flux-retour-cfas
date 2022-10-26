import { Box, Flex } from "@chakra-ui/react";
import PropTypes from "prop-types";
import React from "react";

const variants = {
  success: {
    borderColor: "#18753C",
    background: "#18753C",
    icon: <Box className="ri-checkbox-circle-fill" color="white" marginTop="2w" fontSize="gamma" />,
  },
  error: {
    borderColor: "#ce0500",
    background: "#ce0500",
    icon: <Box className="ri-close-circle-fill" color="white" marginTop="2w" fontSize="gamma" />,
  },
};

const AlertBlock = ({ variant = "success", children, ...rest }) => {
  return (
    <Box {...rest}>
      <Flex borderColor={variants[variant].borderColor} borderWidth={"1px"} borderStyle={"solid"}>
        <Flex background={variants[variant].background} padding={2} alignItems="flex-start">
          {variants[variant].icon}
        </Flex>
        <Box mx="1rem" py={5} color="black">
          {children}
        </Box>
      </Flex>
    </Box>
  );
};

AlertBlock.propTypes = {
  children: PropTypes.node.isRequired,
  variant: PropTypes.string.isRequired,
};

export default AlertBlock;
