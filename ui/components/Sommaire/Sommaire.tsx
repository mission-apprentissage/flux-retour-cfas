import { Box, Text } from "@chakra-ui/react";
import PropTypes from "prop-types";

const Sommaire = ({ isWrapped, children, ...otherProps }: { isWrapped?: boolean; children: any }) => (
  <Box
    position={isWrapped ? "static" : ["static", "static", "static", "sticky"]}
    top={isWrapped ? "0" : ["0", "0", "0", "10"]}
    background="galt"
    padding="3w"
    color="grey.800"
    alignSelf="flex-start"
    fontSize="omega"
    w="40%"
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
