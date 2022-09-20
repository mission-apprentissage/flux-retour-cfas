import { Box, Text } from "@chakra-ui/react";
import PropTypes from "prop-types";

const CardFonctionnementTableauDeBord = ({ Logo, content, ...otherProps }) => (
  <Box border="1px solid" borderColor="#E8EDFF" borderRadius="16px" paddingX="1v" paddingY="2w">
    <Logo display="block" marginX="auto" {...otherProps} />
    <Text textAlign="center" marginTop="1w">
      {content}
    </Text>
  </Box>
);

CardFonctionnementTableauDeBord.propTypes = {
  Logo: PropTypes.string,
  content: PropTypes.string,
};
export default CardFonctionnementTableauDeBord;
