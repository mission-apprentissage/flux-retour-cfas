import { Box, Flex, Text } from "@chakra-ui/react";
import PropTypes from "prop-types";
import React from "react";

const EffectifCard = ({ label, stat, indicatorColor }) => {
  return (
    <Box background="bluesoft.50" padding="3w" minWidth="14rem">
      <Flex alignItems="center">
        <Box borderRadius="50%" background={indicatorColor} h="1rem" w="1rem" mr="1w" />
        <Text color="grey.800" fontSize="gamma" fontWeight="700">
          {stat}
        </Text>
      </Flex>
      <Text color="grey.800" fontSize="epsilon">
        {label}
      </Text>
    </Box>
  );
};

EffectifCard.propTypes = {
  label: PropTypes.string.isRequired,
  stat: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  indicatorColor: PropTypes.string,
};

export default EffectifCard;
