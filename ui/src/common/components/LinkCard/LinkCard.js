import { Box, Button, Text } from "@chakra-ui/react";
import PropTypes from "prop-types";
import React from "react";
import { NavLink } from "react-router-dom";

const LinkCard = ({ children, linkText, linkHref }) => {
  return (
    <Box background="bluefrance" fontSize="gamma" paddingY="3w" paddingX="4w" flex="1">
      <Text color="white" marginBottom="2w">
        {children}
      </Text>
      <Button as={NavLink} to={linkHref} variant="primary-dark" size="lg" padding="3w" paddingY="0">
        {linkText}
        <Box as="i" className="ri-arrow-right-line" marginLeft="1w" verticalAlign="middle" />
      </Button>
    </Box>
  );
};

LinkCard.propTypes = {
  linkHref: PropTypes.string.isRequired,
  linkText: PropTypes.string.isRequired,
  children: PropTypes.node.isRequired,
};

export default LinkCard;
