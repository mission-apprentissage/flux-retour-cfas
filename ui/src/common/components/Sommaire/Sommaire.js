import { Box, Text } from "@chakra-ui/react";
import PropTypes from "prop-types";

const Sommaire = ({ children, ...otherProps }) => (
  <Box
    position={["static", "static", "static", "sticky"]}
    top={["0", "0", "0", "10"]}
    background="galt"
    padding="3w"
    color="grey.800"
    alignSelf="flex-start"
    fontSize="omega"
    width="70%"
    {...otherProps}
  >
    <Text fontWeight="bold" marginBottom="1w" fontSize="epsilon">
      SOMMAIRE
    </Text>
    {children}
  </Box>
);

Sommaire.propTypes = {
  children: PropTypes.node.isRequired,
};
export default Sommaire;
