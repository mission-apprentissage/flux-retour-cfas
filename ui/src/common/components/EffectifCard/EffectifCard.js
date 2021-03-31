import { Box, Flex, Text, Tooltip } from "@chakra-ui/react";
import PropTypes from "prop-types";
import React from "react";

const EffectifCard = ({ label, count, indicatorColor, tooltipLabel }) => {
  return (
    <Tooltip
      background="bluefrance"
      padding="1w"
      isDisabled={!tooltipLabel}
      label={tooltipLabel}
      aria-label={tooltipLabel}
      placement="right-end"
    >
      <Box background="bluesoft.50" padding="3w" minWidth="16rem">
        <Flex alignItems="center">
          <Box borderRadius="50%" background={indicatorColor} h="1rem" w="1rem" mr="1w" />
          <Text color="grey.800" fontSize="gamma" fontWeight="700">
            {count}
          </Text>
        </Flex>
        <Text color="grey.800" fontSize="epsilon">
          {label}
        </Text>
      </Box>
    </Tooltip>
  );
};

EffectifCard.propTypes = {
  label: PropTypes.string.isRequired,
  count: PropTypes.number.isRequired,
  indicatorColor: PropTypes.string,
  tooltipLabel: PropTypes.string,
};

export default EffectifCard;
