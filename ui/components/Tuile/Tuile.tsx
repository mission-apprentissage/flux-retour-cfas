import { Box } from "@chakra-ui/react";
import { ReactNode } from "react";

const Tuile = ({ children }: { children: ReactNode }) => (
  <Box borderBottom="4px solid" borderColor="bluefrance" _hover={{ background: "grey.200", cursor: "pointer" }}>
    <Box height="244px" border="1px solid #DDDDDD" borderBottom="0">
      <Box padding="3w" width="180px">
        {children}
      </Box>
    </Box>
  </Box>
);
export default Tuile;
