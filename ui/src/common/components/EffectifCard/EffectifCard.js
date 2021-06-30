import { Box, Tooltip } from "@chakra-ui/react";
import PropTypes from "prop-types";
import React from "react";

const EffectifCard = ({ label, count, tooltipLabel }) => {
  return (
    <Tooltip
      background="bluefrance"
      padding="1w"
      isDisabled={!tooltipLabel}
      label={tooltipLabel}
      aria-label={tooltipLabel}
      placement="right-end"
    >
      <Box backgroundColor="galt" fontSize="gamma" padding="3w" color="grey.800" height="6rem" minWidth="16rem">
        <strong>{count}</strong>
        &nbsp;
        <span>{label}</span>
      </Box>
    </Tooltip>
  );
};

EffectifCard.propTypes = {
  label: PropTypes.string.isRequired,
  count: PropTypes.number.isRequired,
  tooltipLabel: PropTypes.string,
};

export default EffectifCard;
