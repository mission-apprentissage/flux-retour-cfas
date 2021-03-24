import { Box, Flex, Text } from "@chakra-ui/react";
import PropTypes from "prop-types";
import React from "react";

const EffectifCard = ({ label, count, indicatorColor }) => {
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
    </Flex>
  );
};

EffectifCard.propTypes = {
  label: PropTypes.string.isRequired,
  count: PropTypes.number.isRequired,
  indicatorColor: PropTypes.string,
};

export default EffectifCard;
