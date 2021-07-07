import { Box, Tooltip } from "@chakra-ui/react";
import PropTypes from "prop-types";
import React from "react";

const EffectifCard = ({ label, count, tooltipLabel }) => {
  const hasTooltip = Boolean(tooltipLabel);
  return (
    <Box
      as="article"
      backgroundColor="galt"
      fontSize="gamma"
      padding="3w"
      color="grey.800"
      height="6rem"
      minWidth="16rem"
    >
      <strong>{count}</strong>
      &nbsp;
      <span>{label}</span>
      {hasTooltip && (
        <Tooltip background="white" color="grey.800" label={tooltipLabel} aria-label={tooltipLabel} placement="top-end">
          <Box as="i" className="ri-information-line" fontSize="epsilon" color="grey.500" marginLeft="1v" />
        </Tooltip>
      )}
    </Box>
  );
};

EffectifCard.propTypes = {
  label: PropTypes.string.isRequired,
  count: PropTypes.number.isRequired,
  tooltipLabel: PropTypes.string,
};

export default EffectifCard;
