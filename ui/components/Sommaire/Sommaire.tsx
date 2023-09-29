import { Box, Text } from "@chakra-ui/react";
import { ReactNode } from "react";

const Sommaire = ({ isWrapped, children, ...otherProps }: { isWrapped?: boolean; children: ReactNode }) => (
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

export default Sommaire;
