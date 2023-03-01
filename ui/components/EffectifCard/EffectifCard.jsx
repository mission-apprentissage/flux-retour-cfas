import { Box, HStack, Text, Tooltip } from "@chakra-ui/react";
import PropTypes from "prop-types";
import React from "react";

import { formatNumber } from "@/common/utils/stringUtils";

const EffectifCard = ({
  label,
  count,
  tooltipLabel,
  hideCount = false,
  infoText,
  warningText,
  iconClassName,
  accentColor,
}) => {
  const hasTooltip = Boolean(tooltipLabel);
  return (
    <Box
      as="article"
      backgroundColor="galt"
      paddingX="3w"
      paddingY="2w"
      color="grey.800"
      minHeight="120px"
      minWidth="14.5rem"
      borderBottom="4px"
      borderColor={accentColor}
    >
      <HStack>
        <Box as="i" color={accentColor} className={iconClassName} />
        <Box as="strong" fontSize="gamma" marginRight="1v">
          {hideCount ? "_" : formatNumber(count)}
        </Box>
      </HStack>
      {label}
      {hasTooltip && (
        <Tooltip
          background="bluefrance"
          color="white"
          label={<Box padding="1w">{tooltipLabel}</Box>}
          aria-label={tooltipLabel}
        >
          <Box
            as="i"
            className="ri-information-line"
            fontSize="epsilon"
            color="grey.500"
            marginLeft="1w"
            verticalAlign="middle"
          />
        </Tooltip>
      )}
      {(infoText || warningText) && (
        <Text color={infoText ? "grey.700" : "warning"} fontSize="omega" fontWeight="700" marginTop="1v">
          {infoText || warningText}
        </Text>
      )}
    </Box>
  );
};

EffectifCard.propTypes = {
  label: PropTypes.string.isRequired,
  count: PropTypes.number.isRequired,
  tooltipLabel: PropTypes.node,
  hideCount: PropTypes.bool,
  infoText: PropTypes.node,
  warningText: PropTypes.string,
  iconClassName: PropTypes.string.isRequired,
  accentColor: PropTypes.string.isRequired,
};

export default EffectifCard;
