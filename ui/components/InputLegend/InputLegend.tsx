import { Box } from "@chakra-ui/react";
import React, { ReactNode } from "react";

const InputLegend = ({ children }: { children: ReactNode }) => {
  return (
    <Box as="legend" fontSize="omega" fontStyle="italic" color="grey.600" marginBottom="1w">
      {children}
    </Box>
  );
};

export default InputLegend;
