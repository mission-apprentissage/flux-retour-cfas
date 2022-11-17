import { Box, Button, Circle } from "@chakra-ui/react";
import PropTypes from "prop-types";
import { useState } from "react";

const JournalDesEvolutionsTagFilter = ({ children, onShowFilteredData, onHideFilteredData }) => {
  const [filterEnabled, setFilterEnabled] = useState(false);

  const onSetFilterChange = async () => {
    if (filterEnabled === false) {
      onShowFilteredData();
    } else {
      onHideFilteredData();
    }

    setFilterEnabled(!filterEnabled);
  };

  return filterEnabled === false ? (
    <Box mt="5 !important">
      <Button onClick={onSetFilterChange} variant="badge">
        {children}
      </Button>
    </Box>
  ) : (
    <Box mt="5">
      <Button onClick={onSetFilterChange} variant="badgeSelected">
        {children}
        <Circle size="15px" background="white" color="bluefrance" position="absolute" bottom="18px" right="-5px">
          <Box as="i" className="ri-checkbox-circle-line" fontSize="gamma" />
        </Circle>
      </Button>
    </Box>
  );
};

JournalDesEvolutionsTagFilter.propTypes = {
  children: PropTypes.node.isRequired,
  onShowFilteredData: PropTypes.func.isRequired,
  onHideFilteredData: PropTypes.func.isRequired,
};

export default JournalDesEvolutionsTagFilter;
