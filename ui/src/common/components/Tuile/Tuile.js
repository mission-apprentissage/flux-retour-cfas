import { Box } from "@chakra-ui/react";
import PropTypes from "prop-types";

const Tuile = ({ children }) => (
  <Box borderBottom="4px solid" borderColor="bluefrance" _hover={{ background: "grey.200", cursor: "pointer" }}>
    <Box height="244px" border="1px solid #DDDDDD" borderBottom="0">
      <Box padding="3w" width="180px">
        {children}
      </Box>
    </Box>
  </Box>
);

Tuile.propTypes = {
  children: PropTypes.node.isRequired,
};
export default Tuile;
