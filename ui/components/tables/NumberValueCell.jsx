import { Td, Text } from "@chakra-ui/react";
import PropTypes from "prop-types";
import React from "react";
import { formatNumber } from "../../common/utils/stringUtils";

const NumberValueCell = ({ value }) => (
  <Td>
    <Text color="grey.800" fontSize="epsilon" fontWeight="700">
      {formatNumber(value)}
    </Text>
  </Td>
);

NumberValueCell.propTypes = {
  value: PropTypes.number.isRequired,
};

export default NumberValueCell;
