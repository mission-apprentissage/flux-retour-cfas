import { Box, Button, Circle } from "@chakra-ui/react";
import { useState } from "react";

const JournalDesEvolutionsTagFilter = ({
  children,
  onShowFilteredData,
  onHideFilteredData,
}: {
  children: React.ReactNode;
  onShowFilteredData: () => void;
  onHideFilteredData: () => void;
}) => {
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
    <Box>
      <Button onClick={onSetFilterChange} variant="badge">
        {children}
      </Button>
    </Box>
  ) : (
    <Box>
      <Button onClick={onSetFilterChange} variant="badgeSelected">
        {children}
        <Circle size="15px" background="white" color="bluefrance" position="absolute" bottom="18px" right="-5px">
          <Box as="i" className="ri-checkbox-circle-line" fontSize="gamma" />
        </Circle>
      </Button>
    </Box>
  );
};

export default JournalDesEvolutionsTagFilter;
