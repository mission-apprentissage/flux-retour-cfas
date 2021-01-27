import { Box, Divider, Flex, Text } from "@chakra-ui/react";
import PropTypes from "prop-types";
import React from "react";

const DoubleStatCard = ({
  label,
  stat,
  stat2,
  stat2Label,
  background = "bluefrance",
  color = "white",
  indicatorColor,
}) => {
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
      <Divider />
      <Text color={color} fontSize="beta">
        {stat2}
      </Text>
      <Flex alignItems="center">
        {indicatorColor && <Box borderRadius="50%" background={indicatorColor} h="1rem" w="1rem" mr="1w" />}
        <Text color={color} fontSize="zeta" fontWeight="400">
          {stat2Label}
        </Text>
      </Flex>
    </Box>
  );
};

DoubleStatCard.propTypes = {
  label: PropTypes.string.isRequired,
  stat: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  stat2: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  stat2Label: PropTypes.string,
  background: PropTypes.string,
  color: PropTypes.string,
  indicatorColor: PropTypes.string,
};

export default DoubleStatCard;
