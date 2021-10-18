import { Box, Text, Tooltip } from "@chakra-ui/react";
import PropTypes from "prop-types";
import React from "react";

import { formatNumber } from "../../utils/stringUtils";

const EffectifCard = ({ label, count, tooltipLabel, validPeriod = true }) => {
  const hasTooltip = Boolean(tooltipLabel);
  return (
    <Box
      as="article"
      backgroundColor="galt"
      fontSize="gamma"
      padding="3w"
      color="grey.800"
      height="7rem"
      minWidth="16rem"
    >
      <strong>{validPeriod ? formatNumber(count) : "_"}</strong>
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
      {!validPeriod && (
        <>
          <Text color="grey.700" fontSize="zeta" fontWeight="700" mt="1v">
            cet indice ne peut être calculé sur <br /> la période sélectionnée
          </Text>
        </>
      )}
    </Box>
  );
};

EffectifCard.propTypes = {
  label: PropTypes.string.isRequired,
  count: PropTypes.number.isRequired,
  tooltipLabel: PropTypes.string,
  validPeriod: PropTypes.boolean,
};

export default EffectifCard;
