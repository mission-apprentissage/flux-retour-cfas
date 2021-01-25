import { Box, Flex, Text } from "@chakra-ui/react";
import PropTypes from "prop-types";
import React from "react";

const StatCard = ({ label, stat, background = "bluefrance", color = "white", indicatorColor }) => {
  return (
    <Box background={background} borderRadius="0.5rem" padding="3w" width="14rem">
      <Flex alignItems="center">
        {indicatorColor && <Box borderRadius="50%" background={indicatorColor} h="1rem" w="1rem" mr="1w" />}
        <Text color={color} fontSize="zeta" fontWeight="400">
          {label}
        </Text>
      </Flex>
      <Text color={color} fontSize="alpha">
        {stat}
      </Text>
    </Box>
  );
};

StatCard.propTypes = {
  label: PropTypes.string.isRequired,
  stat: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  background: PropTypes.string,
  color: PropTypes.string,
  indicatorColor: PropTypes.string,
};

export default StatCard;
