import { Box, Flex, Text, Tooltip } from "@chakra-ui/react";
import PropTypes from "prop-types";
import React from "react";

import { formatNumber } from "../../utils/stringUtils";
import { DownloadEffectifLink } from "..";

const EffectifCard = ({
  label,
  count,
  effectifIndicateur = null,
  tooltipLabel,
  hideCount = false,
  infoText,
  warningText,
}) => {
  const hasTooltip = Boolean(tooltipLabel);
  return (
    <Box
      as="article"
      backgroundColor="galt"
      paddingX="3w"
      paddingY="2w"
      color="grey.800"
      minHeight="104px"
      minWidth="15rem"
    >
      <Box as="strong" fontSize="gamma" marginRight="1v">
        {hideCount ? "_" : formatNumber(count)}
      </Box>
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
      {effectifIndicateur !== null && count > 0 && (
        <Flex alignItems="center">
          <DownloadEffectifLink effectifIndicateur={effectifIndicateur} count={count} />
        </Flex>
      )}
    </Box>
  );
};

EffectifCard.propTypes = {
  label: PropTypes.string.isRequired,
  count: PropTypes.number.isRequired,
  effectifIndicateur: PropTypes.string,
  tooltipLabel: PropTypes.string,
  hideCount: PropTypes.bool,
  infoText: PropTypes.node,
  warningText: PropTypes.string,
};

export default EffectifCard;
