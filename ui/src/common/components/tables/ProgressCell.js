import { HStack, Progress, Td, Text } from "@chakra-ui/react";
import PropTypes from "prop-types";
import React from "react";

import { formatNumber } from "../../utils/stringUtils";

const ProgressCell = ({ label, value }) => (
  <Td>
    <HStack>
      <Progress size="sm" width="4rem" colorScheme="main" value={value} />
      &nbsp;
      <Text color="grey.800" fontSize="gamma" fontWeight="700">
        {formatNumber(label)}
      </Text>
    </HStack>
  </Td>
);

ProgressCell.propTypes = {
  label: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  value: PropTypes.number.isRequired,
};

export default ProgressCell;
