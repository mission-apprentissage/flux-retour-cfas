import { Box, Flex, Text } from "@chakra-ui/react";
import PropTypes from "prop-types";
import React from "react";

const EffectifCard = ({ label, evolution, count, indicatorColor }) => {
  const roundedEvolution = evolution !== null ? Math.round(evolution * 10) / 10 : null;
  const evolutionText = evolution === null ? "N/A" : roundedEvolution >= 0 ? `+${roundedEvolution}` : roundedEvolution;

  return (
    <Flex background="bluesoft.50" padding="3w" minWidth="16rem" justifyContent="space-between">
      <div>
        <Flex alignItems="center">
          <Box borderRadius="50%" background={indicatorColor} h="1rem" w="1rem" mr="1w" />
          <Text color="grey.800" fontSize="gamma" fontWeight="700">
            {count}
          </Text>
        </Flex>
        <Text color="grey.800" fontSize="epsilon">
          {label}
        </Text>
      </div>
      <Box as="legend" fontWeight="700">
        {evolutionText}%
      </Box>
    </Flex>
  );
};

EffectifCard.propTypes = {
  label: PropTypes.string.isRequired,
  count: PropTypes.number.isRequired,
  evolution: PropTypes.number,
  indicatorColor: PropTypes.string,
};

export default EffectifCard;
