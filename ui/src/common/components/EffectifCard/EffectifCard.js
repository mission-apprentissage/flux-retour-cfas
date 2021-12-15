import { Box, Text, Tooltip } from "@chakra-ui/react";
import PropTypes from "prop-types";
import React from "react";

import { formatNumber } from "../../utils/stringUtils";

const EffectifCard = ({ label, count, tooltipLabel, hideCount = false, hideReason }) => {
  const hasTooltip = Boolean(tooltipLabel);
  return (
    <Box
      as="article"
      backgroundColor="galt"
      fontSize="gamma"
      padding="3w"
      color="grey.800"
      minHeight="6rem"
      minWidth="16rem"
    >
      <strong>{hideCount ? "_" : formatNumber(count)}</strong>
      &nbsp;
      <span>{label}</span>
      {hasTooltip && (
        <Tooltip
          background="bluefrance"
          color="white"
          label={<Box padding="1w">{tooltipLabel}</Box>}
          aria-label={tooltipLabel}
        >
          <Box as="i" className="ri-information-line" fontSize="epsilon" color="grey.500" marginLeft="1v" />
        </Tooltip>
      )}
      {hideCount && (
        <Text color="grey.700" fontSize="zeta" fontWeight="700" mt="1v">
          {hideReason}
        </Text>
      )}
    </Box>
  );
};

EffectifCard.propTypes = {
  label: PropTypes.string.isRequired,
  count: PropTypes.number.isRequired,
  tooltipLabel: PropTypes.string,
  hideCount: PropTypes.bool,
  hideReason: PropTypes.node,
};

export default EffectifCard;
